```
███╗   ███╗███████╗ ██████╗ ██╗    ██╗███╗   ███╗███████╗ ██████╗ ██╗    ██╗
████╗ ████║██╔════╝██╔═══██╗██║    ██║████╗ ████║██╔════╝██╔═══██╗██║    ██║
██╔████╔██║█████╗  ██║   ██║██║ █╗ ██║██╔████╔██║█████╗  ██║   ██║██║ █╗ ██║
██║╚██╔╝██║██╔══╝  ██║   ██║██║███╗██║██║╚██╔╝██║██╔══╝  ██║   ██║██║███╗██║
██║ ╚═╝ ██║███████╗╚██████╔╝╚███╔███╔╝██║ ╚═╝ ██║███████╗╚██████╔╝╚███╔███╔╝
╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚══╝╚══╝
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
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

---

</div>

---

## 🩺 What is Meowmeow?

> *"You describe how you feel. Meowmeow figures out what it means."*

**Meowmeow** is a production-grade Medical AI platform built for intelligent symptom triage and health risk assessment. It accepts raw, unstructured user input — the way you'd actually describe pain to a doctor — and runs it through a multi-stage AI pipeline that returns a **risk severity score**, a ranked list of **possible conditions**, **actionable next steps**, and **adaptive follow-up questions** to narrow the clinical picture.

This is not a chatbot wrapper. Under the hood, Meowmeow runs a purpose-built **Retrieval-Augmented Generation (RAG)** pipeline over curated medical knowledge, combined with a specialized **NLP inference layer** for clinical entity extraction. Every response is grounded in retrieved medical context — not hallucinated. Not guessed. Not interpolated.

```
  User types:  "I've had a splitting headache behind my eyes for 3 days,
                light makes it worse, and I feel nauseous."
                      │
                      ▼
  Meowmeow:    ┌─ Risk Level     →  HIGH
               ├─ Likely Causes  →  Migraine (primary), elevated ICP (rule out)
               ├─ Next Steps     →  Hydrate, avoid screens, seek GP if persists >24h
               └─ Follow-up      →  "Any fever or stiff neck alongside this?"
```

> ⚕️ **Disclaimer:** Meowmeow is a research and educational tool. It is not a substitute for professional medical diagnosis or treatment.

---

## ✦ Features at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  → Symptom input via natural language (free-text)           │
│  → NLP-based clinical entity extraction                     │
│  → RAG-grounded condition differentials                     │
│  → Risk level scoring (Low / Moderate / High / Critical)    │
│  → Triaged next-step recommendations                        │
│  → Adaptive follow-up questioning engine                    │
│  → Google Sign-In (Firebase Auth)                           │
│  → Full session history per authenticated user              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Role |
|---|---|
| React 18 + Vite | SPA framework with fast HMR dev server |
| Tailwind CSS / Vanilla CSS | Utility-first styling + custom design tokens |
| Framer Motion | Page transitions, component animations |
| Firebase Auth | Google OAuth 2.0 Sign-In |

### Backend

| Technology | Role |
|---|---|
| FastAPI (Python) | REST API — async, auto-documented via OpenAPI |
| SQLAlchemy | ORM layer — models, relationships, migrations |
| Pydantic v2 | Request/response schema validation |
| PyJWT | Session token signing and verification |

### AI / ML Microservice

| Technology | Role |
|---|---|
| Flask | Lightweight inference server |
| Hugging Face Transformers | NLP model inference (symptom extraction) |
| LangChain / RAG Pipeline | Retrieval-augmented generation orchestration |
| ChromaDB | Vector store for semantic medical knowledge retrieval |

### Infrastructure

| Service | What lives there |
|---|---|
| Vercel | Frontend (React) + Backend (FastAPI as Serverless Functions via `api/`) |
| Render | ML microservice (Flask, heavy model weights) |
| Neon PostgreSQL | Managed serverless Postgres — AWS `ap-southeast-1` |
| Firebase | Authentication provider |

---

## 🧠 AI Architecture — Deep Dive

### The RAG Pipeline

Meowmeow's intelligence does not come from a single fine-tuned model. It comes from a **Retrieval-Augmented Generation** pipeline that grounds every LLM response in actual retrieved medical knowledge, dramatically reducing hallucination.

```mermaid
flowchart TD
    A[📝 User Symptom Input] --> B[NLP Preprocessing]
    B --> C[Clinical Entity Extractor\nHuggingFace Transformers]
    C --> D[Structured Symptom Object\njson]

    D --> E[Query Embedder\nSentence Transformers]
    E --> F[(ChromaDB\nVector Store)]
    F --> G[Top-K Semantic Chunks\nMedical Knowledge Base]

    G --> H[Context Assembly\nRAG Prompt Builder]
    D --> H

    H --> I[LLM Inference\nGrounded Generation]
    I --> J[Structured Output Parser\nPydantic]

    J --> K1[Risk Score]
    J --> K2[Condition Differentials]
    J --> K3[Next Steps]
    J --> K4[Follow-up Questions]

    K1 & K2 & K3 & K4 --> L[FastAPI Response → Frontend]
```

**How the knowledge base is built:**

```
Medical Datasets (guidelines, symptom corpora, ICD-10 references)
        ↓
  Text chunking + cleaning
        ↓
  Embedding model (Sentence Transformers)
        ↓
  ChromaDB ingestion → persistent vector store
        ↓
  At inference time: query → top-K relevant chunks → injected into LLM prompt
```

When a user submits symptoms, the pipeline embeds the query, retrieves the most semantically relevant medical knowledge chunks from ChromaDB, assembles them into a structured prompt, and passes everything to the language model. The model never generates in a vacuum — it always has authoritative context to reason from.

---

### NLP — Clinical Entity Extraction

Before retrieval even begins, raw user text passes through a **specialized medical NLP model** (via Hugging Face Transformers) that performs:

- **Named Entity Recognition (NER)** — identifying symptom tokens (`"sharp chest pain"`, `"shortness of breath"`)
- **Negation detection** — distinguishing `"no fever"` from `"fever"`
- **Severity signal extraction** — parsing intensity cues (`"mild"`, `"severe"`, `"intermittent"`)
- **Duration and onset parsing** — temporal context that affects risk scoring

The output is a structured symptom object (JSON) passed downstream to the RAG retriever and risk scorer.

---

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL PLATFORM                            │
│                                                                     │
│   ┌─────────────────────┐        ┌──────────────────────────────┐  │
│   │   frontend/         │        │   api/                       │  │
│   │   React + Vite      │◄──────►│   FastAPI → Serverless Fn    │  │
│   │   Static Build      │        │   (Python 3.11 runtime)      │  │
│   └─────────────────────┘        └──────────────┬───────────────┘  │
└──────────────────────────────────────────────────┼──────────────────┘
                                                   │
              ┌────────────────────────────────────┼──────────────────┐
              │                                    │                  │
              ▼                                    ▼                  ▼
   ┌─────────────────────┐          ┌──────────────────────┐  ┌──────────────┐
   │   RENDER            │          │   NEON POSTGRESQL    │  │   FIREBASE   │
   │   Flask ML Server   │          │   Serverless DB      │  │   Auth       │
   │   :8001             │          │   ap-southeast-1     │  │   (Google)   │
   │   (model weights,   │          │   (user data,        │  └──────────────┘
   │    ChromaDB,        │          │    session history,  │
   │    Transformers)    │          │    analysis logs)    │
   └─────────────────────┘          └──────────────────────┘
```

**Why this split?**

Vercel Serverless Functions have a **250MB deployment size limit** — incompatible with PyTorch model weights and ChromaDB. The ML microservice is therefore hosted on Render, which supports persistent disk, longer execution timeouts, and uncapped bundle sizes. The FastAPI backend on Vercel communicates with the Render ML service over HTTP, acting as an orchestration layer.

### Monorepo Structure

```
ieee_internal_hack/
│
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── firebase.js
│   └── vite.config.js
│
├── backend/                # FastAPI application
│   ├── main.py
│   ├── models/             # SQLAlchemy models
│   ├── routes/             # API route handlers
│   ├── schemas/            # Pydantic schemas
│   └── auth/               # PyJWT auth logic
│
├── ml/                     # Flask inference microservice
│   ├── app.py
│   ├── rag/                # RAG pipeline
│   │   ├── embedder.py
│   │   ├── retriever.py
│   │   └── chroma_store/
│   ├── nlp/                # NLP extraction logic
│   │   └── extractor.py
│   └── models/             # Model weights (gitignored)
│
├── api/                    # Vercel serverless entry point (backend)
│   └── index.py
│
├── start_all.bat           # One-command local launcher
├── vercel.json
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1 — Clone the repository

```bash
git clone https://github.com/quirky-sharan/ieee_internal_hack.git
cd ieee_internal_hack
```

### 2 — Environment Variables

Create `.env` files in the relevant directories:

**`backend/.env`**
```env
DATABASE_URL=postgresql://user:password@host/dbname     # Neon connection string
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

### 3 — Launch Everything

From the root directory, run:

```bat
start_all.bat
```

This single script boots all three services in parallel:

```
┌─────────────────────────────────────────────────┐
│  ML Inference Server  →  http://localhost:8001  │
│  FastAPI Backend      →  http://localhost:8000  │
│  React Frontend       →  http://localhost:5173  │
└─────────────────────────────────────────────────┘
```

> **Note:** First run will download model weights and build the ChromaDB vector store. This may take a few minutes depending on your internet connection.

---

## 🗂️ API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Submit symptoms → returns full analysis |
| `GET` | `/api/history` | Fetch session history for authenticated user |
| `POST` | `/api/auth/verify` | Verify Firebase token, issue JWT |
| `GET` | `/api/health` | Service health check |
| `POST` | `/ml/extract` | (Internal) NLP entity extraction |
| `POST` | `/ml/retrieve` | (Internal) ChromaDB RAG retrieval |

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

> PRs are open and welcome. If you have ideas for improving the diagnostic accuracy of the AI pipeline — better embedding models, expanded knowledge bases, improved NLP extraction — open an issue or submit a pull request. Clinical accuracy is the north star.

---

## 🤝 Contributing

```
1. Fork the repository
2. Create your feature branch  →  git checkout -b feature/improve-rag-retrieval
3. Commit your changes         →  git commit -m 'feat: improve top-K chunk selection'
4. Push to the branch          →  git push origin feature/improve-rag-retrieval
5. Open a Pull Request
```

Areas we're especially keen on improving:
- Retrieval precision (better chunking strategies, rerankers)
- NLP model accuracy on rare symptom descriptions
- Risk scoring calibration against clinical benchmarks
- Expanded medical knowledge base coverage

---

## ⚠️ Medical Disclaimer

Meowmeow is an AI-assisted research tool built for educational and informational purposes. It is **not** a licensed medical device, and outputs should **not** be used as a substitute for professional clinical judgment. Always consult a qualified healthcare provider for diagnosis and treatment decisions.

---

<div align="center">

```
╔══════════════════════════════════════════════════════════╗
║     Built with obsessive attention to clinical accuracy  ║
║                  — Team Meowmeow, 2024 —                 ║
╚══════════════════════════════════════════════════════════╝
```

[![Repo](https://img.shields.io/badge/GitHub-quirky--sharan%2Fieee__internal__hack-181717?style=flat-square&logo=github)](https://github.com/quirky-sharan/ieee_internal_hack)
[![Demo](https://img.shields.io/badge/Live%20Demo-ieee--internal--hack.vercel.app-6366f1?style=flat-square&logo=vercel)](https://ieee-internal-hack.vercel.app/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red?style=flat-square)](https://github.com/quirky-sharan/ieee_internal_hack)

</div>
