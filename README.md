```
  ███████╗ ██████╗ ██╗   ██╗██╗███╗   ██╗ ██████╗ ██╗  ██╗
  ██╔════╝██╔═══██╗██║   ██║██║████╗  ██║██╔═══██╗╚██╗██╔╝
  █████╗  ██║   ██║██║   ██║██║██╔██╗ ██║██║   ██║ ╚███╔╝
  ██╔══╝  ██║▄▄ ██║██║   ██║██║██║╚██╗██║██║   ██║ ██╔██╗
  ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║╚██████╔╝██╔╝ ██╗
  ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝
```

<div align="center">

*Symptom Analysis & Intelligent Risk Assessment — Powered by RAG + NLP*

### 🌐 [ieee-internal-hack.vercel.app](https://ieee-internal-hack.vercel.app/)

> *Try the live platform — no install required.*

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20App-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://ieee-internal-hack.vercel.app/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://python.langchain.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

---

</div>

---

## 🩺 What is Equinox?

> *"You describe how you feel. Equinox figures out what it means."*

**Equinox** is a production-grade Medical AI platform engineered for intelligent symptom triage and health risk assessment. It accepts raw, unstructured natural language input — the way you'd actually describe discomfort to a doctor — and routes it through a multi-stage AI pipeline that returns a **calibrated risk severity score**, a ranked differential list of **possible conditions**, **actionable next steps**, and **adaptive follow-up questions** to sharpen the clinical picture with every exchange.

This is not a chatbot wrapper over a general-purpose LLM. Under the hood, Equinox runs a purpose-built **Retrieval-Augmented Generation (RAG)** pipeline over a curated medical knowledge corpus, fronted by a **specialized NLP extraction layer** that structures raw symptom descriptions before any retrieval takes place. Every response is grounded in retrieved, authoritative medical context — not hallucinated, not interpolated, not guessed.

```
  User types:  "Splitting headache behind my eyes for 3 days,
                light makes it unbearable, and I keep feeling nauseous."
                        │
                        ▼
  ┌─ [NLP]  Entity extraction → symptoms, severity, duration, negations
  │
  ├─ [RAG]  Semantic retrieval → top-K relevant medical knowledge chunks
  │
  ├─ [LLM]  Grounded generation → response built on retrieved context only
  │
  └─ Equinox returns:
        Risk Level    →  HIGH
        Likely Causes →  Migraine (primary), elevated ICP (rule-out)
        Next Steps    →  Hydrate, screen rest, GP if no improvement >24h
        Follow-up     →  "Any fever or neck stiffness alongside this?"
```

> ⚕️ **Medical Disclaimer:** Equinox is a research and educational tool. It is not a substitute for professional medical diagnosis or clinical treatment.

---

## ✦ Features

```
┌─────────────────────────────────────────────────────────────────┐
│  → Free-text symptom input — describe it the way you would      │
│  → Multi-stage NLP clinical entity extraction                   │
│  → RAG-grounded condition differential generation               │
│  → Four-tier risk scoring  (Low / Moderate / High / Critical)   │
│  → Triaged, actionable next-step recommendations                │
│  → Adaptive follow-up questioning to narrow the differential    │
│  → Google Sign-In via Firebase Auth                             │
│  → Full per-user session history with persistent storage        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Role |
|---|---|
| React 18 + Vite | SPA framework — fast HMR dev server, optimized production build |
| Tailwind CSS / Vanilla CSS | Utility-first styling with custom design tokens |
| Framer Motion | Fluid page transitions and component animations |
| Firebase Auth | Google OAuth 2.0 Sign-In |

### Backend

| Technology | Role |
|---|---|
| FastAPI (Python 3.11) | Async REST API — auto-documented via OpenAPI/Swagger |
| SQLAlchemy | ORM layer — models, relationships, session management |
| Pydantic v2 | Request/response schema validation and serialization |
| PyJWT | Session token signing, verification and expiry |

### AI / ML Microservice

| Technology | Role |
|---|---|
| Flask | Lightweight Python inference server |
| Hugging Face Transformers | Medical NLP model inference — NER, negation, severity |
| Sentence Transformers | Dense vector embeddings for semantic similarity |
| LangChain | RAG orchestration — prompt assembly, chain management |
| ChromaDB | Persistent vector store for medical knowledge retrieval |
| Groq / OpenAI-compatible LLM | Grounded response generation |

---

## 🧠 AI/ML Architecture — Full Deep Dive

Equinox's intelligence is not a single model. It is a **three-layer AI pipeline** where each layer has a distinct, non-overlapping responsibility: extraction, retrieval, and generation. No layer generates in a vacuum — every output feeds the next.

---

### Layer 1 — NLP: Clinical Entity Extraction

Before any retrieval or generation takes place, raw free-text passes through a **specialized medical NLP model** loaded via Hugging Face Transformers. This is not a general-purpose text classifier. It is a clinically-trained extraction layer designed to convert unstructured symptom prose into a normalized, machine-readable symptom object.

**What it does:**

```
  Raw input:  "I've had this dull ache in my lower back for about a week.
               No fever. It gets worse when I sit for too long."
                              │
                              ▼
            ┌─────────────────────────────────────────────────┐
            │  Named Entity Recognition (NER)                 │
            │    → "dull ache"         [SYMPTOM]              │
            │    → "lower back"        [BODY_SITE]            │
            │    → "a week"            [DURATION]             │
            │    → "sits for too long" [AGGRAVATING_FACTOR]   │
            │                                                  │
            │  Negation Detection                              │
            │    → "No fever"          [SYMPTOM: fever = ¬]   │
            │                                                  │
            │  Severity Parsing                                │
            │    → "dull"              [INTENSITY: low]       │
            │                                                  │
            │  Temporal Extraction                             │
            │    → "a week"            [ONSET: chronic]       │
            └─────────────────────────────────────────────────┘
                              │
                              ▼
            {
              "symptoms": ["lower back pain"],
              "negated":  ["fever"],
              "severity": "mild",
              "duration": "~7 days",
              "aggravators": ["prolonged sitting"],
              "onset": "gradual"
            }
```

**Capabilities in detail:**

- **Named Entity Recognition (NER)** — identifies symptom tokens (`"sharp chest pain"`), body site references (`"right shoulder"`), and clinical descriptors
- **Negation Detection** — correctly maps `"no fever"` to `fever: false`, preventing false positives that would corrupt the retrieval query
- **Severity Signal Extraction** — parses linguistic intensity cues: `"mild"`, `"severe"`, `"unbearable"`, `"intermittent"`, `"constant"`
- **Duration and Onset Parsing** — extracts temporal context (`"for three days"`, `"since this morning"`) that materially affects risk tier assignment
- **Aggravating/Relieving Factor Parsing** — captures what makes symptoms better or worse, informing both retrieval and follow-up question generation

The output is a **structured symptom object** (JSON schema) that flows into both the retrieval layer and the risk scoring logic.

---

### Layer 2 — RAG: Semantic Medical Knowledge Retrieval

This is the core of Equinox's anti-hallucination strategy. Instead of asking an LLM to generate a diagnosis from memory, Equinox **retrieves the most semantically relevant medical knowledge** for the presented symptoms and passes that context directly into the generation prompt.

#### Knowledge Base Construction

```
  Medical source datasets
  (clinical guidelines, symptom corpora, ICD-10 references,
   differential diagnosis references, triage protocols)
          │
          ▼
  ┌──────────────────────────────┐
  │  Text Preprocessing          │
  │  → chunking (512 tokens)     │
  │  → deduplication             │
  │  → noise removal             │
  └──────────────┬───────────────┘
                 │
                 ▼
  ┌──────────────────────────────┐
  │  Sentence Transformer        │
  │  Embedding Model             │
  │  → dense vector per chunk    │
  │  → semantic space alignment  │
  └──────────────┬───────────────┘
                 │
                 ▼
  ┌──────────────────────────────┐
  │  ChromaDB                    │
  │  Persistent Vector Store     │
  │  → indexed by embedding      │
  │  → metadata preserved        │
  │  → cosine similarity search  │
  └──────────────────────────────┘
```

#### Inference-Time Retrieval

At inference time, the structured symptom object from Layer 1 is **re-embedded** using the same Sentence Transformer model and used as the query vector against ChromaDB:

```
  Structured symptom JSON
          │
          ▼
  Query embedding (Sentence Transformers)
          │
          ▼
  ChromaDB cosine similarity search
          │
          ▼
  Top-K most semantically relevant medical knowledge chunks
  (K is configurable; default K=5)
          │
          ▼
  Retrieved chunks → ranked by relevance score → filtered by threshold
```

The top-K chunks are the **ground truth context** that the LLM will reason over. The model cannot and does not reason beyond this retrieved context — this architectural constraint is what prevents hallucination of medical facts.

---

### Layer 3 — LLM: Grounded Generation

With the structured symptom object and the retrieved context assembled, LangChain orchestrates the **prompt construction and LLM call**.

#### Prompt Assembly

```
  ┌──────────────────────────────────────────────────────────────┐
  │  SYSTEM PROMPT                                               │
  │  → Clinical reasoning persona                                │
  │  → Output schema definition (JSON)                           │
  │  → Strict grounding instruction:                             │
  │    "Respond only based on the provided context.              │
  │     Do not use knowledge outside of what is given."          │
  ├──────────────────────────────────────────────────────────────┤
  │  RETRIEVED CONTEXT  (from ChromaDB)                          │
  │  → Chunk 1: [medical text...]                                │
  │  → Chunk 2: [medical text...]                                │
  │  → Chunk 3: [medical text...]                                │
  │     ... up to K chunks                                       │
  ├──────────────────────────────────────────────────────────────┤
  │  USER INPUT  (structured symptom object)                     │
  │  → Symptoms, severity, duration, negations, aggravators      │
  ├──────────────────────────────────────────────────────────────┤
  │  OUTPUT INSTRUCTION                                          │
  │  → Return structured JSON:                                   │
  │    { risk_level, conditions[], next_steps[], follow_up[] }   │
  └──────────────────────────────────────────────────────────────┘
```

#### Structured Output Parsing

The LLM response is validated against a **Pydantic schema** before being returned to the FastAPI layer. Malformed or incomplete outputs trigger a retry with tightened constraints.

```
  LLM raw output
        │
        ▼
  Pydantic v2 parser
        │
        ├── risk_level      →  Enum["LOW", "MODERATE", "HIGH", "CRITICAL"]
        ├── conditions[]    →  List[{ name, confidence, reasoning }]
        ├── next_steps[]    →  List[str]
        └── follow_up[]     →  List[str]
```

---

### Full Pipeline — End to End

```
  ┌───────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │   User types free-text symptom description                        │
  │                         │                                         │
  │                         ▼                                         │
  │          ┌──────────────────────────────┐                         │
  │          │   NLP Extraction Layer        │                         │
  │          │   HuggingFace Transformers    │                         │
  │          │                              │                         │
  │          │   NER → Negation →           │                         │
  │          │   Severity → Duration        │                         │
  │          └──────────────┬───────────────┘                         │
  │                         │  Structured Symptom JSON                │
  │             ┌───────────┴───────────┐                             │
  │             │                       │                             │
  │             ▼                       ▼                             │
  │   ┌──────────────────┐   ┌──────────────────────┐                 │
  │   │  Query Embedder   │   │   Risk Pre-Scorer     │                │
  │   │  Sentence        │   │   (severity + duration│                │
  │   │  Transformers    │   │    heuristics)        │                │
  │   └────────┬─────────┘   └──────────┬────────────┘                │
  │            │                        │                             │
  │            ▼                        │                             │
  │   ┌──────────────────┐              │                             │
  │   │   ChromaDB        │              │                             │
  │   │   Vector Store    │              │                             │
  │   │   (cosine search) │              │                             │
  │   └────────┬─────────┘              │                             │
  │            │  Top-K chunks          │                             │
  │            ▼                        │                             │
  │   ┌──────────────────────────────┐  │                             │
  │   │   LangChain RAG Prompt       │◄─┘                             │
  │   │   Builder                    │                                │
  │   │   (context + symptoms +      │                                │
  │   │    schema instruction)       │                                │
  │   └──────────────┬───────────────┘                                │
  │                  │                                                │
  │                  ▼                                                │
  │   ┌──────────────────────────────┐                                │
  │   │   LLM Inference              │                                │
  │   │   (grounded, context-only)   │                                │
  │   └──────────────┬───────────────┘                                │
  │                  │                                                │
  │                  ▼                                                │
  │   ┌──────────────────────────────┐                                │
  │   │   Pydantic Output Parser     │                                │
  │   │   + Schema Validation        │                                │
  │   └──────────────┬───────────────┘                                │
  │                  │                                                │
  │         ┌────────┴────────┐                                       │
  │         │                 │                                       │
  │    Risk Level      Condition Differentials                        │
  │    Next Steps      Follow-up Questions                            │
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘
```

---

### Risk Scoring — How It Works

Risk tier assignment is a **two-signal fusion**, not a pure LLM output:

```
  Signal 1 — NLP Heuristic Pre-Score
  ┌────────────────────────────────────────────────────┐
  │  Severity tokens  →  weighted score contribution   │
  │  Duration class   →  acute / subacute / chronic    │
  │  Negation map     →  remove false-positive signals │
  │  Red flag keywords→  "chest", "paralysis", "blood" │
  └─────────────────────────┬──────────────────────────┘
                            │
  Signal 2 — LLM Reasoned Score
  ┌────────────────────────────────────────────────────┐
  │  LLM evaluates symptom cluster against retrieved   │
  │  medical context and assigns one of:               │
  │    LOW / MODERATE / HIGH / CRITICAL                │
  └─────────────────────────┬──────────────────────────┘
                            │
                            ▼
              Final risk tier = max(signal_1, signal_2)
              (conservative: always escalate, never downgrade)
```

---

### Adaptive Follow-Up Engine

After the initial analysis, Equinox generates **clinically targeted follow-up questions** based on what was *not* established in the original input. These are not generic clarifiers — they are grounded in which differentials from the retrieved context remain unresolvable without additional information.

```
  Retrieved differentials include:
    → Migraine     (requires: photophobia confirmed, no neck stiffness)
    → Meningitis   (requires: fever, neck stiffness, rash)
    → Cluster HA   (requires: eye redness, unilateral, cyclical pattern)

  Missing data from input → generates questions:
    → "Do you have any stiffness or pain when moving your neck?"
    → "Is the pain on one side of the head or both?"
    → "Have you noticed any rash or skin changes?"
```

---

## 🗂️ Codebase Structure

```
equinox/
│
├── frontend/                    # React 18 + Vite application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route-level page components
│   │   └── firebase.js          # Firebase Auth configuration
│   └── vite.config.js
│
├── backend/                     # FastAPI application
│   ├── main.py                  # App entrypoint, CORS, router mounting
│   ├── models/                  # SQLAlchemy ORM models
│   ├── routes/                  # Endpoint handlers (analyze, history, auth)
│   ├── schemas/                 # Pydantic request/response schemas
│   └── auth/                    # PyJWT token issuance and verification
│
├── ml/                          # Flask AI/ML inference microservice
│   ├── app.py                   # Flask server, route registration
│   ├── rag/
│   │   ├── embedder.py          # Sentence Transformer embedding logic
│   │   ├── retriever.py         # ChromaDB query and top-K selection
│   │   └── chroma_store/        # Persisted vector index (gitignored)
│   ├── nlp/
│   │   └── extractor.py         # HuggingFace NER + negation + severity
│   └── models/                  # Downloaded model weights (gitignored)
│
├── api/                         # Serverless backend entrypoint
│   └── index.py                 # ASGI adapter
│
├── fix_imports.py               # Import path normalisation utility
├── start_all.bat                # One-command local launcher (all services)
├── vercel.json                  # Frontend + API routing config
├── render.yaml                  # ML service process config
└── package.json                 # Root workspace config
```

---

## ⚙️ Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1 — Clone

```bash
git clone https://github.com/quirky-sharan/equinox.git
cd equinox
```

### 2 — Environment Variables

**`backend/.env`**
```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_jwt_secret_here
ML_SERVICE_URL=http://localhost:8001
```

**`frontend/.env`**
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_BASE_URL=http://localhost:8000
```

**`ml/.env`**
```env
CHROMA_PERSIST_DIR=./rag/chroma_store
MODEL_NAME=your_hf_model_id
```

### 3 — Launch

```bat
start_all.bat
```

Boots all three services in parallel:

```
  ML Inference Server  →  http://localhost:8001
  FastAPI Backend      →  http://localhost:8000
  React Frontend       →  http://localhost:5173
```

> **Note:** First run downloads model weights and builds the ChromaDB index. Allow a few minutes.

---

## 🗂️ API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Submit symptoms → full AI analysis response |
| `GET` | `/api/history` | Fetch analysis history for authenticated user |
| `POST` | `/api/auth/verify` | Exchange Firebase token for signed JWT |
| `GET` | `/api/health` | Service liveness check |
| `POST` | `/ml/extract` | *(Internal)* NLP entity extraction |
| `POST` | `/ml/retrieve` | *(Internal)* ChromaDB RAG retrieval |

---

## 👥 Contributors

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://github.com/quirky-sharan"><b>Sharan Soni</b></a><br/>
      <sub>AI/ML · RAG Pipeline · System Architecture · Frontend</sub>
    </td>
    <td align="center" width="50%">
      <b>Devatman Pal</b><br/>
      <sub>Frontend · Backend · Database Management</sub>
    </td>
  </tr>
</table>

---

## 🤝 Contributing

```
1. Fork the repository
2. Create a feature branch   →  git checkout -b feature/improve-rag-retrieval
3. Commit your changes        →  git commit -m 'feat: improve top-K chunk selection'
4. Push to branch             →  git push origin feature/improve-rag-retrieval
5. Open a Pull Request
```

Areas we're especially keen on improving:

- **Retrieval precision** — better chunking strategies, cross-encoder rerankers
- **NLP model accuracy** — rare symptom descriptions, multi-symptom co-reference
- **Risk scoring calibration** — benchmarking against validated clinical triage datasets
- **Knowledge base coverage** — expanded ICD-10 mapping, paediatric and geriatric corpora

---

## ⚠️ Medical Disclaimer

Equinox is an AI-assisted research tool built for educational and informational purposes only. It is **not** a licensed medical device, and its outputs should **not** be treated as a substitute for professional clinical judgment, diagnosis, or treatment. Always consult a qualified healthcare provider.

---

<div align="center">

```
  ╔══════════════════════════════════════════════════════════════╗
  ║   Built with obsessive attention to clinical accuracy        ║
  ║                  — Team Equinox, 2026 —                      ║
  ╚══════════════════════════════════════════════════════════════╝
```

[![Repo](https://img.shields.io/badge/GitHub-quirky--sharan%2Fequinox-181717?style=flat-square&logo=github)](https://github.com/quirky-sharan/equinox)
[![Demo](https://img.shields.io/badge/Live%20Demo-ieee--internal--hack.vercel.app-6366f1?style=flat-square&logo=vercel)](https://ieee-internal-hack.vercel.app/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red?style=flat-square)](https://github.com/quirky-sharan/equinox)

</div>
