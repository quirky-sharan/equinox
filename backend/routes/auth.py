from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import jwt as pyjwt
from cryptography.x509 import load_pem_x509_certificate
import logging

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, FirebaseAuthRequest, TokenResponse, UserOut, UserUpdate
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("uvicorn.error")

# Google's public certificates for verifying Firebase ID tokens
GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

# Cache for Google's public certificates
_cached_certs = None
_certs_fetched_at = None

async def _get_google_certs():
    """Fetch and cache Google's public certificates."""
    global _cached_certs, _certs_fetched_at
    import time

    # Cache for 1 hour
    if _cached_certs and _certs_fetched_at and (time.time() - _certs_fetched_at) < 3600:
        return _cached_certs

    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_CERTS_URL, timeout=10.0)
        if resp.status_code != 200:
            raise HTTPException(status_code=503, detail="Could not fetch Google certificates")
        _cached_certs = resp.json()
        _certs_fetched_at = time.time()
        return _cached_certs

async def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token using Google's public certificates."""
    try:
        # Get the key ID from the token header
        unverified_header = pyjwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Token missing key ID")

        # Fetch Google's public certificates
        certs = await _get_google_certs()
        cert_pem = certs.get(kid)
        if not cert_pem:
            # Invalidate cache and retry
            global _cached_certs, _certs_fetched_at
            _cached_certs = None
            _certs_fetched_at = None
            certs = await _get_google_certs()
            cert_pem = certs.get(kid)
            if not cert_pem:
                raise HTTPException(status_code=401, detail="Could not find matching certificate for token")

        # Extract the public key from the certificate
        cert_obj = load_pem_x509_certificate(cert_pem.encode("utf-8"))
        public_key = cert_obj.public_key()



        # Verify and decode the token
        payload = pyjwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=settings.FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}",
            leeway=60,
        )
        return payload

    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Firebase token has expired")
    except pyjwt.InvalidTokenError as e:
        logger.error(f"Firebase token validation error: {e}")
        unverified_payload = pyjwt.decode(id_token, options={"verify_signature": False})
        expected_aud = settings.FIREBASE_PROJECT_ID
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(e)} | Audience Expected: {expected_aud} | Got Payload: {unverified_payload}")

@router.post("/register", response_model=TokenResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        age=payload.age,
        sex=payload.sex,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))

@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: FirebaseAuthRequest, db: Session = Depends(get_db)):
    """Verify Firebase ID token using Google's public certificates and upsert user."""
    logger.info(f"Google auth attempt - token length: {len(payload.firebase_token)}")

    # Verify the Firebase ID token using Google's public certificates
    firebase_payload = await verify_firebase_token(payload.firebase_token)

    firebase_uid = firebase_payload.get("user_id", "") or firebase_payload.get("sub", "")
    email = firebase_payload.get("email", "")
    name = payload.full_name or firebase_payload.get("name", "")
    photo = payload.photo_url or firebase_payload.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email associated with this Google account")

    logger.info(f"Firebase token verified for: {email}")

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            full_name=name,
            photo_url=photo,
            firebase_uid=firebase_uid,
        )
        db.add(user)
        logger.info(f"Created new user for: {email}")
    else:
        user.firebase_uid = firebase_uid
        if name:
            user.full_name = name
        if photo:
            user.photo_url = photo
        logger.info(f"Updated existing user: {email}")

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"Google auth successful for: {email}")
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

