# DecentraTrust AI

> AI-Powered Decentralized Reputation & Trust Enforcement System

---

## 🚧 Project Status: Under Development

This project is being built incrementally using a PR-by-PR approach. See [PR_PLAN.md](./PR_PLAN.md) for the complete build sequence.

---

## 📖 Overview

DecentraTrust AI is a blockchain-based trust and reputation system enhanced with AI-powered scoring and fraud detection.

### Core Principles

- **Blockchain** = Trust, enforcement, immutability
- **AI** = Scoring, fraud detection (off-chain)
- **Oracle** = Secure bridge between AI and blockchain
- **Smart contracts NEVER depend directly on AI logic**

---

## 🗂️ Repository Structure

```
decentratrust-ai/
│
├── contracts/           # Solidity smart contracts
│   ├── Identity.sol
│   ├── Reputation.sol
│   ├── PolicyEngine.sol
│   └── OracleMock.sol
│
├── ai-engine/           # AI/ML scoring engine
│   ├── data/
│   ├── model/
│   └── score_service.py
│
├── backend/             # FastAPI backend server
│   ├── main.py
│   └── oracle_listener.py
│
├── frontend/            # Web frontend
│
├── scripts/             # Deployment & utility scripts
│
├── test/                # Smart contract tests
│
├── README.md
└── PR_PLAN.md
```

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity
- **Blockchain**: Ethereum (Hardhat)
- **AI Engine**: Python
- **Backend**: FastAPI
- **Frontend**: TBD

---

## 📄 License

MIT License

---

## 🤝 Contributing

This project follows a strict PR-by-PR development process. Please see [PR_PLAN.md](./PR_PLAN.md) for contribution guidelines.
