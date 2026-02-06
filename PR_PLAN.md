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

### ✅ PR #3 — Reputation Contract
**Status**: `COMPLETE ✅`

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
- [x] Score must be 0–100
- [x] Oracle address set once in constructor
- [x] Revert on unauthorized updates

---

### ✅ PR #4 — Policy Engine
**Status**: `COMPLETE ✅`

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
- [x] Read-only logic
- [x] No score mutation
- [x] Must depend ONLY on Reputation.sol

---

### ✅ PR #5 — Oracle Mock Contract
**Status**: `COMPLETE ✅`

**File**: `contracts/OracleMock.sol`

**Purpose**: Simulate AI → blockchain communication.

**Locked Interface**:
```solidity
function pushScore(address user, uint8 score) external;
```

**Acceptance Criteria**:
- [x] OracleMock must be the oracle address
- [x] This interface must NEVER change

---

### ✅ PR #6 — Smart Contract Tests
**Status**: `COMPLETE ✅`

**Folder**: `test/`

**Required Tests**:
- [x] Identity registration works
- [x] Duplicate identity fails
- [x] Oracle-only score update enforced
- [x] Policy tier logic correct

**Test Summary**: 38 tests passing ✅

---

### ✅ PR #7 — AI Scoring Stub
**Status**: `COMPLETE ✅`

**File**: `ai-engine/score_service.py`

**Purpose**: Simulate ML scoring without real training.

**Requirements**:
- [x] Deterministic output
- [x] Accept behavioral metrics
- [x] Return score 0–100

---

### ✅ PR #8 — Oracle API Backend
**Status**: `COMPLETE ✅`

**Folder**: `backend/`

**Required Endpoints**:
- [x] `POST /evaluate`
- [x] `POST /push-score`

**Constraints**:
- [x] Use FastAPI
- [x] No authentication yet
- [x] Clean separation of concerns

---

### ✅ PR #9 — Minimal Frontend
**Status**: `COMPLETE ✅`

**Goals**:
- [x] Wallet connect
- [x] Display trust score
- [x] Display access tier

---

### ✅ PR #10 — Final Documentation
**Status**: `COMPLETE ✅`

**Tasks**:
- [x] Update README.md with full documentation
- [x] Problem statement
- [x] Architecture
- [x] Blockchain role
- [x] AI role
- [x] Oracle design
- [x] Future roadmap

**Final Check**:
- [x] All contracts compile
- [x] Tests pass
- [x] API works with mock
- [x] UI reflects system state

---

## 🎯 Final Goal - ACHIEVED ✅

At the end, the system:
- ✅ Works end-to-end
- ✅ Is AI-ready
- ✅ Is blockchain-secure
- ✅ Is portfolio & recruiter ready
- ✅ Is extensible into research or startup

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Smart Contracts | 4 |
| Test Cases | 38 |
| API Endpoints | 5 |
| Languages | Solidity, Python, JavaScript |
| Total LOC | ~3,500+ |
| Build Status | ✅ Passing |

---

## 🏆 Completion Summary

**All 10 PRs have been successfully completed!**

The DecentraTrust AI system is now fully functional with:
- Decentralized identity management
- AI-powered trust scoring
- Blockchain-stored reputation
- Tier-based access control
- Oracle bridge architecture
- Modern web interface
