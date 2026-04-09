import httpx
import json

VAPI_API_KEY = "d253e488-8a8a-4651-a8d7-c1110b420810"
VAPI_BASE = "https://api.vapi.ai"

resp = httpx.get(
    f"{VAPI_BASE}/call",
    headers={"Authorization": f"Bearer {VAPI_API_KEY}"}
)

calls = resp.json()
outbound_calls = [c for c in calls if c.get("type") == "outboundPhoneCall"]

with open("test_vapi_output_utf8.txt", "w", encoding="utf-8") as f:
    if outbound_calls:
        f.write(json.dumps(outbound_calls[-1], indent=2))
    else:
        f.write("No outbound calls found")
