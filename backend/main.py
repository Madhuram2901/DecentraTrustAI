"""
DecentraTrust AI - Backend API
==============================

FastAPI backend that bridges AI scoring with blockchain oracle.

Endpoints:
- POST /evaluate - Evaluate user metrics and return trust score
- POST /push-score - Push a score to the blockchain via oracle
- GET /health - Health check endpoint
"""

import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from ai-engine (handle hyphen in folder name)
import importlib.util
spec = importlib.util.spec_from_file_location(
    "score_service",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai-engine", "score_service.py")
)
score_service = importlib.util.module_from_spec(spec)
spec.loader.exec_module(score_service)

UserMetrics = score_service.UserMetrics
calculate_score = score_service.calculate_score
get_score_details = score_service.get_score_details

# Initialize FastAPI app
app = FastAPI(
    title="DecentraTrust AI API",
    description="AI-powered trust scoring and oracle bridge for blockchain",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Request/Response Models ============

class EvaluateRequest(BaseModel):
    """Request model for user evaluation"""
    wallet_address: str = Field(..., description="User's wallet address")
    transaction_count: int = Field(..., ge=0, description="Total transactions")
    avg_transaction_value: float = Field(..., ge=0, description="Average transaction value in USD")
    account_age_days: int = Field(..., ge=0, description="Account age in days")
    dispute_count: int = Field(0, ge=0, description="Number of disputes")
    successful_transactions: int = Field(..., ge=0, description="Successful transactions")
    frequency_per_day: float = Field(..., ge=0, description="Transactions per day")
    variance_score: Optional[float] = Field(None, ge=0, le=100, description="Variance in patterns")
    
    class Config:
        json_schema_extra = {
            "example": {
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab01",
                "transaction_count": 100,
                "avg_transaction_value": 500.0,
                "account_age_days": 365,
                "dispute_count": 0,
                "successful_transactions": 98,
                "frequency_per_day": 0.5
            }
        }


class EvaluateResponse(BaseModel):
    """Response model for user evaluation"""
    wallet_address: str
    score: int = Field(..., ge=0, le=100, description="Trust score 0-100")
    tier: str = Field(..., description="Access tier: FULL, LIMITED, or BLOCKED")
    details: dict = Field(..., description="Detailed score breakdown")


class PushScoreRequest(BaseModel):
    """Request model for pushing score to blockchain"""
    wallet_address: str = Field(..., description="User's wallet address")
    score: int = Field(..., ge=0, le=100, description="Trust score to push")
    
    class Config:
        json_schema_extra = {
            "example": {
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab01",
                "score": 85
            }
        }


class PushScoreResponse(BaseModel):
    """Response model for push score operation"""
    success: bool
    wallet_address: str
    score: int
    message: str
    transaction_hash: Optional[str] = None  # Will be populated when blockchain is connected


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    version: str
    blockchain_connected: bool
    oracle_address: Optional[str] = None


# ============ Helper Functions ============

def get_tier_from_score(score: int) -> str:
    """
    Determine access tier based on score.
    
    Tier Logic (matches PolicyEngine.sol):
    - Score >= 80: FULL
    - Score 50-79: LIMITED
    - Score < 50: BLOCKED
    """
    if score >= 80:
        return "FULL"
    elif score >= 50:
        return "LIMITED"
    else:
        return "BLOCKED"


# ============ Global State ============

# Blockchain connection state (will be set by oracle_listener)
blockchain_state = {
    "connected": False,
    "oracle_address": None,
    "reputation_address": None,
}


# ============ API Endpoints ============

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "DecentraTrust AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns API status and blockchain connection state.
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        blockchain_connected=blockchain_state["connected"],
        oracle_address=blockchain_state["oracle_address"]
    )


@app.post("/evaluate", response_model=EvaluateResponse, tags=["Scoring"])
async def evaluate_user(request: EvaluateRequest):
    """
    Evaluate a user's behavioral metrics and return trust score.
    
    This endpoint:
    1. Receives user metrics
    2. Runs AI scoring algorithm
    3. Returns score with tier classification
    
    The score is NOT automatically pushed to blockchain.
    Use /push-score to submit to the oracle.
    """
    try:
        # Convert request to UserMetrics
        metrics = UserMetrics(
            transaction_count=request.transaction_count,
            avg_transaction_value=request.avg_transaction_value,
            account_age_days=request.account_age_days,
            dispute_count=request.dispute_count,
            successful_transactions=request.successful_transactions,
            frequency_per_day=request.frequency_per_day,
            variance_score=request.variance_score
        )
        
        # Calculate score
        score = calculate_score(metrics)
        details = get_score_details(metrics)
        tier = get_tier_from_score(score)
        
        return EvaluateResponse(
            wallet_address=request.wallet_address,
            score=score,
            tier=tier,
            details=details
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")


@app.post("/push-score", response_model=PushScoreResponse, tags=["Blockchain"])
async def push_score(request: PushScoreRequest):
    """
    Push a trust score to the blockchain via the oracle.
    
    This endpoint:
    1. Validates the score (0-100)
    2. Calls the OracleMock contract's pushScore function
    3. Returns transaction result
    
    Note: In this stub version, the blockchain call is simulated.
    Full implementation requires oracle_listener to be running.
    """
    try:
        # Validate score range
        if not 0 <= request.score <= 100:
            raise HTTPException(
                status_code=400,
                detail="Score must be between 0 and 100"
            )
        
        # Check blockchain connection
        if not blockchain_state["connected"]:
            # Stub response when blockchain is not connected
            return PushScoreResponse(
                success=True,
                wallet_address=request.wallet_address,
                score=request.score,
                message="Score recorded (blockchain not connected - stub mode)",
                transaction_hash=None
            )
        
        # TODO: Actual blockchain call via oracle_listener
        # This will be implemented when web3 is integrated
        
        return PushScoreResponse(
            success=True,
            wallet_address=request.wallet_address,
            score=request.score,
            message="Score pushed to blockchain",
            transaction_hash="0x..."  # Will be actual tx hash
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Push error: {str(e)}")


@app.post("/evaluate-and-push", response_model=PushScoreResponse, tags=["Combined"])
async def evaluate_and_push(request: EvaluateRequest):
    """
    Convenience endpoint that evaluates metrics and pushes score in one call.
    
    Combines /evaluate and /push-score functionality.
    """
    # First evaluate
    evaluate_response = await evaluate_user(request)
    
    # Then push
    push_request = PushScoreRequest(
        wallet_address=request.wallet_address,
        score=evaluate_response.score
    )
    
    push_response = await push_score(push_request)
    push_response.message = f"Evaluated (score: {evaluate_response.score}, tier: {evaluate_response.tier}) - {push_response.message}"
    
    return push_response


# ============ Startup/Shutdown Events ============

@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    print("🚀 DecentraTrust AI API starting...")
    print("📊 AI Scoring Service: Ready")
    print("⛓️ Blockchain: Stub mode (not connected)")
    print("📖 API Docs available at /docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 DecentraTrust AI API shutting down...")


# ============ Main Entry Point ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
