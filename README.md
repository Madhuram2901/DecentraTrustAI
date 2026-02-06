# DecentraTrust AI

<div align="center">

![DecentraTrust AI](https://img.shields.io/badge/DecentraTrust-AI-6366f1?style=for-the-badge&logo=ethereum&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**AI-Powered Decentralized Reputation & Trust Enforcement System**

[Live Demo](#) • [API Docs](#api-endpoints) • [Architecture](#architecture) • [Getting Started](#getting-started)

</div>

---

## 🎯 Problem Statement

In decentralized ecosystems, **trust is fragmented**. Traditional reputation systems are:
- ❌ Centralized and manipulable
- ❌ Siloed within single platforms
- ❌ Lacking intelligent fraud detection
- ❌ Unable to enforce access policies on-chain

**DecentraTrust AI** solves this by combining:
- ✅ **Immutable blockchain storage** for trust scores
- ✅ **AI-powered behavioral analysis** for intelligent scoring
- ✅ **On-chain policy enforcement** for tier-based access control
- ✅ **Decentralized oracle architecture** for secure AI-to-blockchain communication

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│              (Wallet Connect, Score Display, Tier View)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│                    (FastAPI Server)                             │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  /evaluate      │    │  /push-score    │                     │
│  │  AI Scoring     │    │  Oracle Bridge  │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
└───────────┼──────────────────────┼──────────────────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────────┐  ┌──────────────────────────────────────┐
│     AI ENGINE         │  │            BLOCKCHAIN                │
│  ┌─────────────────┐  │  │  ┌────────────┐  ┌────────────────┐  │
│  │ Score Service   │  │  │  │ OracleMock │→ │   Reputation   │  │
│  │ - Metrics       │  │  │  └────────────┘  └───────┬────────┘  │
│  │ - ML Scoring    │  │  │                          │           │
│  │ - Fraud Detect  │  │  │  ┌────────────┐  ┌───────▼────────┐  │
│  └─────────────────┘  │  │  │  Identity  │  │  PolicyEngine  │  │
└───────────────────────┘  │  └────────────┘  └────────────────┘  │
                           └──────────────────────────────────────┘
```

### Component Roles

| Component | Role | Technology |
|-----------|------|------------|
| **Identity.sol** | Decentralized identity registration | Solidity |
| **Reputation.sol** | Store trust scores (0-100) | Solidity |
| **PolicyEngine.sol** | Tier-based access control | Solidity |
| **OracleMock.sol** | AI → Blockchain bridge | Solidity |
| **score_service.py** | AI behavioral scoring | Python |
| **Backend API** | REST API for scoring & oracle | FastAPI |
| **Frontend** | User interface | HTML/CSS/JS |

---

## 🧠 How It Works

### 1. Identity Registration
Users register their wallet address with an IPFS metadata hash containing their identity information.

### 2. Behavioral Analysis
The AI engine analyzes on-chain behavior:
- Transaction patterns
- Account age
- Success/dispute ratios
- Activity frequency

### 3. Trust Scoring
A deterministic scoring algorithm (future: ML model) calculates a trust score (0-100):

```
Score Factors:
+ Account age bonus (max +15)
+ Success rate bonus (max +20)
+ Transaction volume bonus (max +10)
+ Consistent frequency bonus (max +10)
- Dispute penalties (-5 each, max -30)
- New account penalty (max -10)
- Suspicious activity penalty (max -20)
```

### 4. On-Chain Enforcement
The PolicyEngine enforces access tiers:

| Score | Tier | Access Level |
|-------|------|--------------|
| ≥80 | **FULL** 🌟 | Complete ecosystem access |
| 50-79 | **LIMITED** ⚡ | Restricted features |
| <50 | **BLOCKED** 🔒 | No access |

---

## 📁 Repository Structure

```
decentratrust-ai/
│
├── contracts/                 # Solidity smart contracts
│   ├── Identity.sol          # Decentralized identity
│   ├── Reputation.sol        # Trust score storage
│   ├── PolicyEngine.sol      # Access tier logic
│   └── OracleMock.sol        # Oracle simulation
│
├── ai-engine/                 # AI scoring engine
│   └── score_service.py      # Scoring algorithm
│
├── backend/                   # FastAPI backend
│   ├── main.py               # API server
│   ├── oracle_listener.py    # Blockchain connector
│   └── requirements.txt      # Python dependencies
│
├── frontend/                  # Web interface
│   ├── index.html            # Main page
│   ├── styles.css            # Styling
│   └── app.js                # Application logic
│
├── scripts/                   # Deployment scripts
│   └── deploy.js             # Contract deployment
│
├── test/                      # Contract tests
│   ├── Identity.test.js
│   ├── Reputation.test.js
│   ├── PolicyEngine.test.js
│   └── OracleMock.test.js
│
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Node.js dependencies
├── README.md                 # This file
└── PR_PLAN.md                # Development roadmap
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- MetaMask browser extension

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Madhuram2901/DecentraTrustAI.git
cd DecentraTrustAI
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

Expected output: **38 passing tests** ✅

### Local Deployment

1. **Start local blockchain**
```bash
npx hardhat node
```

2. **Deploy contracts** (new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. **Start backend API** (new terminal)
```bash
cd backend
python -m uvicorn main:app --reload
```

4. **Open frontend**
Open `frontend/index.html` in your browser

---

## 📡 API Endpoints

### Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/evaluate` | Evaluate user metrics |
| POST | `/push-score` | Push score to blockchain |
| POST | `/evaluate-and-push` | Combined evaluation & push |

### Example: Evaluate User

```bash
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab01",
    "transaction_count": 100,
    "avg_transaction_value": 500,
    "account_age_days": 365,
    "dispute_count": 0,
    "successful_transactions": 98,
    "frequency_per_day": 0.5
  }'
```

### Response

```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab01",
  "score": 95,
  "tier": "FULL",
  "details": {
    "base_score": 50,
    "factors": {
      "account_age": 10.0,
      "success_rate": 19.6,
      "transaction_volume": 6.0,
      "frequency": 9.0
    },
    "penalties": {},
    "final_score": 95
  }
}
```

---

## 🔐 Smart Contract Interfaces

### Identity.sol
```solidity
function registerIdentity(string calldata metadataHash) external;
function getIdentity(address user) external view returns (address, string memory, bool);
```

### Reputation.sol
```solidity
function getScore(address user) external view returns (uint8);
function updateScore(address user, uint8 newScore) external; // Oracle only
```

### PolicyEngine.sol
```solidity
function canPerformAction(address user) external view returns (bool);
function getUserTier(address user) external view returns (uint8);
```

### OracleMock.sol
```solidity
function pushScore(address user, uint8 score) external;
```

---

## 🛣️ Roadmap

### Phase 1: Foundation ✅
- [x] Smart contract development
- [x] AI scoring stub
- [x] Backend API
- [x] Frontend interface
- [x] Comprehensive testing

### Phase 2: Enhancement (Planned)
- [ ] Real ML model training
- [ ] Chainlink oracle integration
- [ ] Multi-chain support
- [ ] IPFS metadata storage
- [ ] GraphQL API

### Phase 3: Production (Planned)
- [ ] Mainnet deployment
- [ ] Audit & security review
- [ ] DAO governance
- [ ] SDK for developers
- [ ] Mobile app

---

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test file
npx hardhat test test/Identity.test.js
```

### Test Coverage

| Contract | Tests | Status |
|----------|-------|--------|
| Identity | 6 | ✅ Passing |
| Reputation | 9 | ✅ Passing |
| PolicyEngine | 9 | ✅ Passing |
| OracleMock | 14 | ✅ Passing |
| **Total** | **38** | ✅ **All Passing** |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [PR_PLAN.md](./PR_PLAN.md) for our development methodology.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenZeppelin for smart contract patterns
- Hardhat for development framework
- FastAPI for backend framework
- The Ethereum community

---

<div align="center">

**Built with ❤️ for the decentralized future**

[![GitHub Stars](https://img.shields.io/github/stars/Madhuram2901/DecentraTrustAI?style=social)](https://github.com/Madhuram2901/DecentraTrustAI)

</div>
