/**
 * DecentraTrust AI - Frontend Application
 * ========================================
 * 
 * Handles wallet connection, score display, and tier visualization.
 * Integrates with MetaMask and backend API.
 */

// ============ Configuration ============

const CONFIG = {
    API_URL: 'http://localhost:8000',
    CHAIN_ID: '0x7A69', // 31337 in hex (Hardhat local)
    CONTRACTS: {
        REPUTATION: null, // Will be set after deployment
        POLICY_ENGINE: null,
        ORACLE_MOCK: null
    }
};

// ============ State ============

const state = {
    connected: false,
    account: null,
    score: null,
    tier: null,
    provider: null
};

// ============ DOM Elements ============

const elements = {
    connectWallet: document.getElementById('connectWallet'),
    disconnectWallet: document.getElementById('disconnectWallet'),
    walletInfo: document.getElementById('walletInfo'),
    walletAddress: document.getElementById('walletAddress'),
    scoreNumber: document.getElementById('scoreNumber'),
    scoreProgress: document.getElementById('scoreProgress'),
    tierBadge: document.getElementById('tierBadge'),
    tierName: document.getElementById('tierName'),
    tierDescription: document.getElementById('tierDescription'),
    lastUpdated: document.getElementById('lastUpdated'),
    refreshScore: document.getElementById('refreshScore'),
    viewHistory: document.getElementById('viewHistory'),
    requestEvaluation: document.getElementById('requestEvaluation'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ============ Utility Functions ============

/**
 * Shorten an Ethereum address for display
 */
function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    const iconMap = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };

    elements.toast.querySelector('.toast-icon').textContent = iconMap[type] || iconMap.info;
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type} show`;

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

/**
 * Get tier info based on score
 */
function getTierInfo(score) {
    if (score >= 80) {
        return {
            name: 'FULL',
            icon: '🌟',
            class: 'full',
            description: 'Full access to all ecosystem features'
        };
    } else if (score >= 50) {
        return {
            name: 'LIMITED',
            icon: '⚡',
            class: 'limited',
            description: 'Limited access - some features restricted'
        };
    } else {
        return {
            name: 'BLOCKED',
            icon: '🔒',
            class: 'blocked',
            description: 'Access blocked - improve your score'
        };
    }
}

/**
 * Update the score circle visualization
 */
function updateScoreCircle(score) {
    const circumference = 2 * Math.PI * 45; // r=45
    const offset = circumference - (score / 100) * circumference;

    // Add SVG gradient definition if not exists
    const svg = elements.scoreProgress.closest('svg');
    if (!svg.querySelector('defs')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1"/>
                <stop offset="100%" style="stop-color:#22d3ee"/>
            </linearGradient>
        `;
        svg.insertBefore(defs, svg.firstChild);
    }

    elements.scoreProgress.style.stroke = 'url(#scoreGradient)';
    elements.scoreProgress.style.strokeDashoffset = offset;
}

// ============ Wallet Functions ============

/**
 * Check if MetaMask is installed
 */
function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

/**
 * Connect to MetaMask wallet
 */
async function connectWallet() {
    if (!isMetaMaskInstalled()) {
        showToast('Please install MetaMask to continue', 'error');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            showToast('No accounts found', 'error');
            return;
        }

        state.account = accounts[0];
        state.connected = true;

        // Update UI
        updateWalletUI();

        // Fetch score
        await fetchScore();

        showToast('Wallet connected successfully!', 'success');

    } catch (error) {
        console.error('Connection error:', error);
        showToast(error.message || 'Failed to connect wallet', 'error');
    }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
    state.connected = false;
    state.account = null;
    state.score = null;
    state.tier = null;

    updateWalletUI();
    resetScoreUI();

    showToast('Wallet disconnected', 'info');
}

/**
 * Update wallet UI based on connection state
 */
function updateWalletUI() {
    if (state.connected && state.account) {
        elements.connectWallet.classList.add('hidden');
        elements.walletInfo.classList.remove('hidden');
        elements.walletAddress.textContent = shortenAddress(state.account);

        // Enable action buttons
        elements.refreshScore.disabled = false;
        elements.viewHistory.disabled = false;
        elements.requestEvaluation.disabled = false;
    } else {
        elements.connectWallet.classList.remove('hidden');
        elements.walletInfo.classList.add('hidden');

        // Disable action buttons
        elements.refreshScore.disabled = true;
        elements.viewHistory.disabled = true;
        elements.requestEvaluation.disabled = true;
    }
}

/**
 * Reset score UI to default state
 */
function resetScoreUI() {
    elements.scoreNumber.textContent = '--';
    elements.scoreProgress.style.strokeDashoffset = 283;
    elements.tierBadge.className = 'tier-badge';
    elements.tierName.textContent = 'UNKNOWN';
    elements.tierDescription.textContent = 'Connect your wallet to see your access tier';
    elements.lastUpdated.textContent = 'Connect wallet to view score';
}

// ============ Score Functions ============

/**
 * Fetch score from blockchain or API
 */
async function fetchScore() {
    if (!state.account) return;

    elements.scoreNumber.textContent = '...';
    elements.scoreNumber.classList.add('loading');

    try {
        // Try to fetch from API first (works in stub mode)
        const response = await fetch(`${CONFIG.API_URL}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.account,
                transaction_count: Math.floor(Math.random() * 200),
                avg_transaction_value: 100 + Math.random() * 500,
                account_age_days: Math.floor(Math.random() * 365),
                dispute_count: Math.floor(Math.random() * 3),
                successful_transactions: Math.floor(Math.random() * 180),
                frequency_per_day: Math.random() * 2
            })
        });

        if (response.ok) {
            const data = await response.json();
            state.score = data.score;
            state.tier = data.tier;
            updateScoreUI(data.score, data.tier);
        } else {
            // Fallback: Generate mock score for demo
            generateMockScore();
        }

    } catch (error) {
        console.log('API not available, using mock data');
        generateMockScore();
    }

    elements.scoreNumber.classList.remove('loading');
}

/**
 * Generate mock score for demo purposes
 */
function generateMockScore() {
    // Generate a somewhat consistent score based on address
    const addressNum = parseInt(state.account.slice(2, 10), 16);
    const score = (addressNum % 60) + 30; // Score between 30-90

    state.score = score;
    state.tier = score >= 80 ? 'FULL' : score >= 50 ? 'LIMITED' : 'BLOCKED';

    updateScoreUI(score, state.tier);
}

/**
 * Update score UI
 */
function updateScoreUI(score, tier) {
    elements.scoreNumber.textContent = score;
    updateScoreCircle(score);

    const tierInfo = getTierInfo(score);
    elements.tierBadge.className = `tier-badge ${tierInfo.class}`;
    elements.tierBadge.querySelector('.tier-icon').textContent = tierInfo.icon;
    elements.tierName.textContent = tierInfo.name;
    elements.tierDescription.textContent = tierInfo.description;

    elements.lastUpdated.textContent = `Last updated: ${new Date().toLocaleString()}`;
}

/**
 * Request AI evaluation
 */
async function requestEvaluation() {
    showToast('Requesting AI evaluation...', 'info');

    try {
        const response = await fetch(`${CONFIG.API_URL}/evaluate-and-push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: state.account,
                transaction_count: 100,
                avg_transaction_value: 250,
                account_age_days: 180,
                dispute_count: 1,
                successful_transactions: 95,
                frequency_per_day: 0.8
            })
        });

        if (response.ok) {
            const data = await response.json();
            showToast(`Evaluation complete! Score: ${data.score}`, 'success');
            await fetchScore();
        } else {
            showToast('Evaluation failed', 'error');
        }
    } catch (error) {
        showToast('API not available - using demo mode', 'warning');
        await fetchScore();
    }
}

// ============ Event Listeners ============

// Wallet connection
elements.connectWallet.addEventListener('click', connectWallet);
elements.disconnectWallet.addEventListener('click', disconnectWallet);

// Action buttons
elements.refreshScore.addEventListener('click', async () => {
    showToast('Refreshing score...', 'info');
    await fetchScore();
    showToast('Score refreshed!', 'success');
});

elements.viewHistory.addEventListener('click', () => {
    showToast('History feature coming soon!', 'info');
});

elements.requestEvaluation.addEventListener('click', requestEvaluation);

// MetaMask events
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            state.account = accounts[0];
            updateWalletUI();
            fetchScore();
        }
    });

    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// ============ Initialization ============

async function init() {
    console.log('🚀 DecentraTrust AI Frontend initialized');

    // Check if already connected
    if (isMetaMaskInstalled()) {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length > 0) {
                state.account = accounts[0];
                state.connected = true;
                updateWalletUI();
                await fetchScore();
            }
        } catch (error) {
            console.log('Not connected yet');
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
