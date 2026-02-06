"""
DecentraTrust AI - Score Service
================================

This module provides AI-powered trust scoring functionality.
Currently implements a deterministic stub that simulates ML scoring.

IMPORTANT: This defines the future ML API contract.
The interface should NOT change to ensure compatibility.

API Contract (LOCKED):
- calculate_score(metrics: UserMetrics) -> int (0-100)
- UserMetrics: { transaction_count, avg_transaction_value, account_age_days, 
                 dispute_count, successful_transactions, frequency_per_day }
"""

from dataclasses import dataclass
from typing import Optional
import math


@dataclass
class UserMetrics:
    """
    Behavioral metrics for a user, used to calculate trust score.
    
    Attributes:
        transaction_count: Total number of transactions
        avg_transaction_value: Average value of transactions (in USD equivalent)
        account_age_days: Age of the account in days
        dispute_count: Number of disputes filed
        successful_transactions: Number of successfully completed transactions
        frequency_per_day: Average transactions per day
        variance_score: Optional - variance in transaction patterns (0-100, lower is better)
    """
    transaction_count: int
    avg_transaction_value: float
    account_age_days: int
    dispute_count: int
    successful_transactions: int
    frequency_per_day: float
    variance_score: Optional[float] = None


def calculate_score(metrics: UserMetrics) -> int:
    """
    Calculate a trust score based on user behavioral metrics.
    
    This is a deterministic scoring algorithm that simulates ML behavior.
    The score is always between 0 and 100.
    
    Scoring Logic:
    - Base score starts at 50
    - Positive factors increase score
    - Negative factors decrease score
    - High frequency with low variance = higher trust
    - Extremely high frequency = potential bot/fraud = lower trust
    
    Args:
        metrics: UserMetrics object containing behavioral data
        
    Returns:
        int: Trust score between 0 and 100
        
    Example:
        >>> metrics = UserMetrics(
        ...     transaction_count=100,
        ...     avg_transaction_value=500,
        ...     account_age_days=365,
        ...     dispute_count=0,
        ...     successful_transactions=98,
        ...     frequency_per_day=0.5
        ... )
        >>> score = calculate_score(metrics)
        >>> 0 <= score <= 100
        True
    """
    # Start with base score
    score = 50.0
    
    # === Positive Factors ===
    
    # Account age bonus (max +15 points)
    # Older accounts are more trustworthy
    age_bonus = min(metrics.account_age_days / 365 * 10, 15)
    score += age_bonus
    
    # Success rate bonus (max +20 points)
    if metrics.transaction_count > 0:
        success_rate = metrics.successful_transactions / metrics.transaction_count
        success_bonus = success_rate * 20
        score += success_bonus
    
    # Transaction volume bonus (max +10 points)
    # More transactions (within reason) indicate active, trustworthy user
    volume_bonus = min(math.log10(max(metrics.transaction_count, 1) + 1) * 3, 10)
    score += volume_bonus
    
    # Consistent frequency bonus (max +10 points)
    # Regular, moderate activity is good
    if 0.1 <= metrics.frequency_per_day <= 5:
        frequency_bonus = 10 - abs(metrics.frequency_per_day - 1) * 2
        frequency_bonus = max(0, min(frequency_bonus, 10))
        score += frequency_bonus
    
    # Low variance bonus (max +5 points)
    if metrics.variance_score is not None and metrics.variance_score < 30:
        variance_bonus = (30 - metrics.variance_score) / 6
        score += variance_bonus
    
    # === Negative Factors ===
    
    # Dispute penalty (up to -30 points)
    dispute_penalty = min(metrics.dispute_count * 5, 30)
    score -= dispute_penalty
    
    # Very new account penalty (up to -10 points)
    if metrics.account_age_days < 30:
        new_account_penalty = (30 - metrics.account_age_days) / 3
        score -= new_account_penalty
    
    # Extremely high frequency penalty (suspicious activity)
    # More than 10 transactions per day is suspicious
    if metrics.frequency_per_day > 10:
        high_freq_penalty = min((metrics.frequency_per_day - 10) * 2, 20)
        score -= high_freq_penalty
    
    # Very low transaction value with high frequency (potential wash trading)
    if metrics.avg_transaction_value < 10 and metrics.frequency_per_day > 5:
        wash_trading_penalty = 15
        score -= wash_trading_penalty
    
    # === Final Score ===
    
    # Clamp to 0-100 range
    final_score = max(0, min(100, round(score)))
    
    return int(final_score)


def get_score_details(metrics: UserMetrics) -> dict:
    """
    Get detailed breakdown of the trust score calculation.
    
    Useful for debugging and transparency.
    
    Args:
        metrics: UserMetrics object
        
    Returns:
        dict: Detailed score breakdown with factors
    """
    score = 50.0
    details = {
        "base_score": 50,
        "factors": {},
        "penalties": {},
    }
    
    # Age bonus
    age_bonus = min(metrics.account_age_days / 365 * 10, 15)
    details["factors"]["account_age"] = round(age_bonus, 2)
    score += age_bonus
    
    # Success rate
    if metrics.transaction_count > 0:
        success_rate = metrics.successful_transactions / metrics.transaction_count
        success_bonus = success_rate * 20
        details["factors"]["success_rate"] = round(success_bonus, 2)
        score += success_bonus
    
    # Volume bonus
    volume_bonus = min(math.log10(max(metrics.transaction_count, 1) + 1) * 3, 10)
    details["factors"]["transaction_volume"] = round(volume_bonus, 2)
    score += volume_bonus
    
    # Frequency bonus
    if 0.1 <= metrics.frequency_per_day <= 5:
        frequency_bonus = 10 - abs(metrics.frequency_per_day - 1) * 2
        frequency_bonus = max(0, min(frequency_bonus, 10))
        details["factors"]["frequency"] = round(frequency_bonus, 2)
        score += frequency_bonus
    
    # Dispute penalty
    if metrics.dispute_count > 0:
        dispute_penalty = min(metrics.dispute_count * 5, 30)
        details["penalties"]["disputes"] = round(dispute_penalty, 2)
        score -= dispute_penalty
    
    # New account penalty
    if metrics.account_age_days < 30:
        new_account_penalty = (30 - metrics.account_age_days) / 3
        details["penalties"]["new_account"] = round(new_account_penalty, 2)
        score -= new_account_penalty
    
    # High frequency penalty
    if metrics.frequency_per_day > 10:
        high_freq_penalty = min((metrics.frequency_per_day - 10) * 2, 20)
        details["penalties"]["high_frequency"] = round(high_freq_penalty, 2)
        score -= high_freq_penalty
    
    final_score = max(0, min(100, round(score)))
    details["final_score"] = int(final_score)
    
    return details


# === Example usage and testing ===
if __name__ == "__main__":
    # Example: High trust user
    high_trust = UserMetrics(
        transaction_count=200,
        avg_transaction_value=500,
        account_age_days=730,  # 2 years
        dispute_count=0,
        successful_transactions=198,
        frequency_per_day=0.5
    )
    
    # Example: Medium trust user
    medium_trust = UserMetrics(
        transaction_count=50,
        avg_transaction_value=100,
        account_age_days=90,
        dispute_count=1,
        successful_transactions=45,
        frequency_per_day=1.0
    )
    
    # Example: Low trust user
    low_trust = UserMetrics(
        transaction_count=10,
        avg_transaction_value=5,  # Very low value
        account_age_days=7,  # Very new
        dispute_count=3,
        successful_transactions=5,
        frequency_per_day=15  # Suspiciously high
    )
    
    print("=== DecentraTrust AI Score Service ===\n")
    
    print("High Trust User:")
    print(f"  Score: {calculate_score(high_trust)}")
    print(f"  Details: {get_score_details(high_trust)}\n")
    
    print("Medium Trust User:")
    print(f"  Score: {calculate_score(medium_trust)}")
    print(f"  Details: {get_score_details(medium_trust)}\n")
    
    print("Low Trust User:")
    print(f"  Score: {calculate_score(low_trust)}")
    print(f"  Details: {get_score_details(low_trust)}\n")
