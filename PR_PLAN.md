# DecentraTrust AI — Pull Request Plan

> This document tracks the incremental build sequence for DecentraTrust AI.
> Each PR must be completed and verified before moving to the next.

---

## 🛡️ Development Rules

1. **NEVER** skip PRs
2. **NEVER** bundle PRs
3. **NEVER** refactor previous logic unless explicitly requested
4. **ALWAYS** preserve backward compatibility
5. **ALWAYS** ensure each PR compiles, runs, and passes tests

---

## 📋 PR Sequence

### ✅ PR #1 — Project Initialization
**Status**: `COMPLETE ✅`

**Objective**: Create a clean, professional repository foundation.

**Tasks**:
- [x] Initialize repository
- [x] Add folder structure
- [x] Add .gitignore
- [x] Add README.md (skeleton only)
- [x] Add PR_PLAN.md

**Acceptance Criteria**:
- [x] Repo clones with no errors
- [x] No build tooling assumptions yet

---

### ✅ PR #2 — Identity Contract
**Status**: `COMPLETE ✅`

**File**: `contracts/Identity.sol`

**Requirements**:
- Each wallet can register one identity
- Metadata stored as IPFS hash (string)
- No external dependencies

**Locked Interface**:
```solidity
function registerIdentity(string calldata metadataHash) external;
function getIdentity(address user) external view returns (address, string memory, bool);
```

**Acceptance Criteria**:
- [x] Compiles with no warnings
- [x] Can be deployed standalone
- [x] No references to other contracts

---

### ⏳ PR #3 — Reputation Contract
**Status**: `PENDING`

**File**: `contracts/Reputation.sol`

**Responsibilities**:
- Store trust score (0–100)
- Track last updated timestamp
- Only oracle can update score

**Locked Interface**:
```solidity
function getScore(address user) external view returns (uint8);
function updateScore(address user, uint8 newScore) external;
```

**Acceptance Criteria**:
- [ ] Score must be 0–100
- [ ] Oracle address set once in constructor
- [ ] Revert on unauthorized updates

---

### ⏳ PR #4 — Policy Engine
**Status**: `PENDING`

**File**: `contracts/PolicyEngine.sol`

**Responsibilities**:
- Read reputation scores
- Decide access tier

**Tier Logic** (LOCKED):
| Score | Tier |
|-------|------|
| ≥80 | FULL |
| 50–79 | LIMITED |
| <50 | BLOCKED |

**Locked Interface**:
```solidity
function canPerformAction(address user) external view returns (bool);
function getUserTier(address user) external view returns (uint8);
```

**Acceptance Criteria**:
- [ ] Read-only logic
- [ ] No score mutation
- [ ] Must depend ONLY on Reputation.sol

---

### ⏳ PR #5 — Oracle Mock Contract
**Status**: `PENDING`

**File**: `contracts/OracleMock.sol`

**Purpose**: Simulate AI → blockchain communication.

**Locked Interface**:
```solidity
function pushScore(address user, uint8 score) external;
```

**Acceptance Criteria**:
- [ ] OracleMock must be the oracle address
- [ ] This interface must NEVER change

---

### ⏳ PR #6 — Smart Contract Tests
**Status**: `PENDING`

**Folder**: `test/`

**Required Tests**:
- [ ] Identity registration works
- [ ] Duplicate identity fails
- [ ] Oracle-only score update enforced
- [ ] Policy tier logic correct

---

### ⏳ PR #7 — AI Scoring Stub
**Status**: `PENDING`

**File**: `ai-engine/score_service.py`

**Purpose**: Simulate ML scoring without real training.

**Requirements**:
- Deterministic output
- Accept behavioral metrics
- Return score 0–100

---

### ⏳ PR #8 — Oracle API Backend
**Status**: `PENDING`

**Folder**: `backend/`

**Required Endpoints**:
- `POST /evaluate`
- `POST /push-score`

**Constraints**:
- Use FastAPI
- No authentication yet
- Clean separation of concerns

---

### ⏳ PR #9 — Minimal Frontend
**Status**: `PENDING`

**Goals**:
- Wallet connect
- Display trust score
- Display access tier

---

### ⏳ PR #10 — Final Documentation
**Status**: `PENDING`

**Tasks**:
- Update README.md with full documentation
- Problem statement
- Architecture
- Blockchain role
- AI role
- Oracle design
- Future roadmap

---

## 🎯 Final Goal

At the end, the system must:
- ✅ Work end-to-end
- ✅ Be AI-ready
- ✅ Be blockchain-secure
- ✅ Be portfolio & recruiter ready
- ✅ Be extensible into research or startup
