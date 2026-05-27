// FOUC Prevention & Theme Initializer
(function() {
    const theme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();

// Global Constants & State
const API_BASE = '/api/session';
const DECKS = {
    fibonacci: ['0', '0.5', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
    tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
    custom: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕']
};

let state = {
    sessionId: null,
    participantId: null,
    displayName: null,
    role: 'voter',
    isHost: false,
    activeVote: null,
    revealed: false,
    currentStory: '',
    cardType: 'fibonacci',
    participants: [],
    history: [],
    hostId: null
};

let pollingInterval = null;

// Initialize App & Read Storage
window.addEventListener('DOMContentLoaded', () => {
    initTheming();
    checkUrlForInvite();
    restoreSessionState();
    startClientTimer();

    // Resync immediately when the browser tab becomes active again
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && state.sessionId) {
            pollSession();
        }
    });
});

// 1. Theme Configuration
function initTheming() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}

// Check if session ID is in URL search param (invite flow)
function checkUrlForInvite() {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('room') || params.get('invite');
    if (inviteCode && inviteCode.length === 6) {
        const joinCodeInput = document.getElementById('join-code');
        if (joinCodeInput) joinCodeInput.value = inviteCode.toUpperCase();
        switchLandingTab('join');
        showToast(`Loaded invitation code: ${inviteCode.toUpperCase()}`, 'info');
    }
}

// Restore active session state from sessionStorage if page is refreshed
function restoreSessionState() {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = (params.get('room') || params.get('invite') || '').toUpperCase();

    const storedSessionId = sessionStorage.getItem('poker_sessionId');
    const storedPartId = sessionStorage.getItem('poker_participantId');
    const storedName = sessionStorage.getItem('poker_displayName');
    const storedRole = sessionStorage.getItem('poker_role');

    // If the URL invites to a different room than stored, clear storage
    if (inviteCode && storedSessionId && inviteCode !== storedSessionId.toUpperCase()) {
        sessionStorage.removeItem('poker_sessionId');
        sessionStorage.removeItem('poker_participantId');
        sessionStorage.removeItem('poker_displayName');
        sessionStorage.removeItem('poker_role');
        
        state.sessionId = inviteCode;
        state.participantId = null;
        
        const lobbyBadge = document.getElementById('lobby-code-badge');
        if (lobbyBadge) lobbyBadge.textContent = state.sessionId;
        showScreen('lobby-screen');
        updateNavbarBadge(true, state.sessionId);
        return;
    }

    if (storedSessionId && storedPartId) {
        state.sessionId = storedSessionId;
        state.participantId = storedPartId;
        state.displayName = storedName;
        state.role = storedRole || 'voter';
        
        // Jump straight to active polling
        showScreen('game-screen');
        updateNavbarBadge(true, state.sessionId);
        startPolling();
        showToast("Restoring active session...", "info");
    } else if (inviteCode) {
        state.sessionId = inviteCode;
        const lobbyBadge = document.getElementById('lobby-code-badge');
        if (lobbyBadge) lobbyBadge.textContent = state.sessionId;
        showScreen('lobby-screen');
        updateNavbarBadge(true, state.sessionId);
    } else {
        showScreen('landing-screen');
        updateNavbarBadge(false);
    }
}

// UI View Transitions
function showScreen(screenId) {
    ['landing-screen', 'lobby-screen', 'game-screen'].forEach(id => {
        const screenEl = document.getElementById(id);
        if (screenEl) screenEl.classList.add('hidden');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.remove('hidden');

    const footer = document.querySelector('footer');
    const mainEl = document.querySelector('main');
    
    if (screenId === 'game-screen') {
        if (footer) footer.classList.add('hidden');
        if (mainEl) {
            mainEl.classList.add('lg:h-[calc(100vh-73px)]', 'lg:overflow-hidden', 'lg:py-4');
            mainEl.classList.remove('py-8');
        }
    } else {
        if (footer) footer.classList.remove('hidden');
        if (mainEl) {
            mainEl.classList.remove('lg:h-[calc(100vh-73px)]', 'lg:overflow-hidden', 'lg:py-4', 'pb-[140px]');
            mainEl.classList.add('py-8');
        }
    }
}

function switchLandingTab(type) {
    const joinBtn = document.getElementById('tab-join-btn');
    const createBtn = document.getElementById('tab-create-btn');
    const joinForm = document.getElementById('join-form');
    const createForm = document.getElementById('create-form');

    if (!joinBtn || !createBtn || !joinForm || !createForm) return;

    if (type === 'join') {
        joinBtn.className = "flex-1 text-center py-2.5 font-heading text-xl transition-all border-b-2 border-primary dark:border-primary-dark text-text-light dark:text-text-dark";
        createBtn.className = "flex-1 text-center py-2.5 font-heading text-xl transition-all border-b-2 border-transparent text-muted-slate dark:text-text-dark/55 hover:text-text-light dark:hover:text-text-dark";
        joinForm.classList.remove('hidden');
        createForm.classList.add('hidden');
    } else {
        createBtn.className = "flex-1 text-center py-2.5 font-heading text-xl transition-all border-b-2 border-primary dark:border-primary-dark text-text-light dark:text-text-dark";
        joinBtn.className = "flex-1 text-center py-2.5 font-heading text-xl transition-all border-b-2 border-transparent text-muted-slate dark:text-text-dark/55 hover:text-text-light dark:hover:text-text-dark";
        createForm.classList.remove('hidden');
        joinForm.classList.add('hidden');
    }
}

function updateNavbarBadge(show, code = '') {
    const badge = document.getElementById('session-badge-container');
    const codeEl = document.getElementById('active-session-code');
    const shareBtn = document.getElementById('nav-share-btn');
    const leaveBtn = document.getElementById('nav-leave-btn');
    
    if (show) {
        if (codeEl) codeEl.textContent = `ROOM: ${code}`;
        if (badge) {
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        }
        if (shareBtn) shareBtn.classList.remove('hidden');
        if (leaveBtn) leaveBtn.classList.remove('hidden');
    } else {
        if (badge) {
            badge.classList.add('hidden');
            badge.classList.remove('flex');
        }
        if (shareBtn) shareBtn.classList.add('hidden');
        if (leaveBtn) leaveBtn.classList.add('hidden');
    }
}

// ==================== API SUBMISSIONS ====================

// CREATE Session
async function handleCreateSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('create-name');
    const deckInput = document.getElementById('create-deck');
    if (!nameInput || !deckInput) return;

    const name = nameInput.value.trim();
    const cardType = deckInput.value;

    try {
        const res = await fetch(`${API_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, cardType })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        state.sessionId = data.sessionId;
        state.cardType = data.cardType;
        
        // Advance to Lobby View
        const lobbyBadge = document.getElementById('lobby-code-badge');
        if (lobbyBadge) lobbyBadge.textContent = state.sessionId;
        showScreen('lobby-screen');
        updateNavbarBadge(true, state.sessionId);
        showToast("Session created! Let's set up your display name.", "success");
    } catch (err) {
        showToast(`Creation error: ${err.message}`, "error");
    }
}

// JOIN invite code submit
function handleJoinSubmit(e) {
    e.preventDefault();
    const joinCodeInput = document.getElementById('join-code');
    if (!joinCodeInput) return;

    const code = joinCodeInput.value.trim().toUpperCase();
    if (code.length !== 6) {
        showToast("Code must be exactly 6 characters.", "warning");
        return;
    }
    state.sessionId = code;
    const lobbyBadge = document.getElementById('lobby-code-badge');
    if (lobbyBadge) lobbyBadge.textContent = state.sessionId;
    showScreen('lobby-screen');
    updateNavbarBadge(true, state.sessionId);
}

// ENTER SESSION (nickname selection)
async function handleLobbySubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('lobby-name');
    const roleInput = document.querySelector('input[name="lobby-role"]:checked');
    if (!nameInput || !roleInput) return;

    const displayName = nameInput.value.trim();
    const role = roleInput.value;

    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                displayName,
                role,
                participantId: state.participantId // Send existing ID if reconnecting
            })
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // Save in storage & state
        state.participantId = data.participantId;
        state.displayName = data.displayName;
        state.role = data.role;
        state.isHost = data.isHost;

        sessionStorage.setItem('poker_sessionId', state.sessionId);
        sessionStorage.setItem('poker_participantId', state.participantId);
        sessionStorage.setItem('poker_displayName', state.displayName);
        sessionStorage.setItem('poker_role', state.role);

        // Update URL search parameters to make bookmarking/sharing easier
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${state.sessionId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        showScreen('game-screen');
        startPolling();
        showToast(`Successfully joined room ${state.sessionId}!`, "success");
    } catch (err) {
        showToast(`Authentication failed: ${err.message}`, "error");
    }
}

// ==================== POLLING & RENDERING ENGINE ====================

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Poll immediately once
    pollSession();
    
    // 2.5 second interval sweep
    pollingInterval = setInterval(pollSession, 2500);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

async function pollSession() {
    if (!state.sessionId) return;

    try {
        const url = new URL(`${API_BASE}/${state.sessionId}`, window.location.origin);
        if (state.participantId) {
            url.searchParams.append('participantId', state.participantId);
        }

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!res.ok) {
            if (res.status === 404) {
                handleSessionNotFound();
                return;
            }
            throw new Error("Failed to reach server");
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Sync data
        state.currentStory = data.currentStory || 'First Story';
        state.revealed = data.revealed;
        state.participants = data.participants || [];
        state.history = data.history || [];
        state.cardType = data.cardType || 'fibonacci';
        state.hostId = data.hostId;
        
        // Recalculate hosting rights
        state.isHost = data.isHost || (state.participantId === data.hostId);

        // Update self info & check if swept
        if (state.participantId) {
            const me = state.participants.find(p => p.id === state.participantId);
            if (me) {
                state.activeVote = me.vote;
            } else {
                // Participant not found in the list returned by the server -> Swept!
                handleParticipantSwept();
                return;
            }
        }

        renderGameWorkspace();

        // Auto-reveal if everyone has voted and I am the host (only if countdown not running)
        const activeVoters = state.participants.filter(p => p.role === 'voter');
        const hasEveryoneVoted = activeVoters.length > 0 && activeVoters.every(v => v.voted);
        if (hasEveryoneVoted && !state.revealed) {
            if (!state.countdownActive) {
                startRevealCountdown();
            }
        } else {
            if (state.countdownActive) {
                cancelRevealCountdown();
            }
        }
    } catch (err) {
        console.error("Polling error:", err);
        showToast("Sync issue. Trying to reconnect...", "warning");
    }
}

function handleParticipantSwept() {
    stopPolling();
    sessionStorage.removeItem('poker_participantId');
    state.participantId = null;
    showToast("Your session expired or was disconnected. Please re-join.", "warning");
    const lobbyBadge = document.getElementById('lobby-code-badge');
    if (lobbyBadge) lobbyBadge.textContent = state.sessionId;
    showScreen('lobby-screen');
}

// Global Visual Roundtable and Timer Utilities
let countdownTimer = null;
let clientTimer = null;
state.countdownActive = false;
state.countdownSec = 5;

function startRevealCountdown() {
    state.countdownActive = true;
    state.countdownSec = 5;
    renderVotersGrid(state.participants.filter(p => p.role === 'voter')); // Redraw grid for countdown status

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        state.countdownSec--;
        
        if (state.countdownSec <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            state.countdownActive = false;
            
            // Trigger reveal if host
            if (state.isHost) {
                triggerReveal();
            }
        } else {
            // Update table center countdown
            renderTableCenter();
        }
    }, 1000);
}

function cancelRevealCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    state.countdownActive = false;
    state.countdownSec = 5;
    renderGameWorkspace();
}

function renderTableCenter() {
    const el = document.getElementById('table-center-content');
    if (!el) return;

    const voters = state.participants.filter(p => p.role === 'voter');

    // 1. Countdown is Active (Flipping in 5,4,3,2,1...)
    if (state.countdownActive) {
        el.innerHTML = `
            <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary dark:border-primary-dark flex items-center justify-center animate-pulse bg-white/5 shadow-neon">
                <span class="text-3xl sm:text-4xl font-extrabold font-heading text-primary dark:text-primary-dark">${state.countdownSec}</span>
            </div>
            <div class="text-[8px] sm:text-[9px] uppercase tracking-widest font-extrabold text-white/80 mt-2 font-mono">REVEALING IN...</div>
        `;
        return;
    }

    // 2. Synchronized Timer is Active
    if (state.currentStory.includes('|')) {
        const [_, expiresStr] = state.currentStory.split('|');
        const expiresAt = parseInt(expiresStr);
        const secs = Math.ceil((expiresAt - Date.now()) / 1000);
        
        if (secs > 0) {
            const mins = Math.floor(secs / 60);
            const remSecs = secs % 60;
            const displayTime = `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
            
            el.innerHTML = `
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-white/30 dark:border-primary-dark/40 flex flex-col items-center justify-center bg-white/5 animate-pulse">
                    <span class="material-symbols-outlined text-xs sm:text-sm text-white/50 dark:text-primary-dark/60 leading-none">timer</span>
                    <span class="text-sm sm:text-base font-bold font-mono text-white dark:text-primary-dark mt-0.5">${displayTime}</span>
                </div>
                <div class="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-white/60 mt-1.5 font-mono">ESTIMATION TIME</div>
            `;
            return;
        } else {
            // Timer expired but votes not revealed yet
            el.innerHTML = `
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-rose-500/50 flex flex-col items-center justify-center bg-rose-500/10">
                    <span class="material-symbols-outlined text-xs sm:text-sm text-rose-400 leading-none">alarm_off</span>
                    <span class="text-[10px] sm:text-xs font-black text-rose-300 uppercase tracking-tighter mt-0.5 leading-none">Time's Up</span>
                </div>
                <div class="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-rose-300 mt-1.5 font-mono">VOTE PENDING</div>
            `;
            return;
        }
    }

    // 3. Revealed State (Show summary info in center of table)
    if (state.revealed) {
        const numericVotes = voters.map(v => parseFloat(v.vote)).filter(val => !isNaN(val));
        let avg = "-";
        if (numericVotes.length > 0) {
            avg = (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1);
        }
        
        const modeVal = getMode(voters.map(v => v.vote).filter(v => v !== null && v !== ''));

        el.innerHTML = `
            <div class="flex items-center gap-2 sm:gap-3">
                <div class="flex flex-col items-center">
                    <span class="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/55 font-mono leading-none">Average</span>
                    <span class="text-xl sm:text-2xl font-extrabold font-heading text-white dark:text-primary-dark mt-1">${avg}</span>
                </div>
                <div class="w-px h-6 sm:h-8 bg-white/10 dark:bg-primary-dark/20"></div>
                <div class="flex flex-col items-center">
                    <span class="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/55 font-mono leading-none">Consensus</span>
                    <span class="text-xl sm:text-2xl font-extrabold font-heading text-white dark:text-accent-cyan mt-1">${modeVal || '-'}</span>
                </div>
            </div>
            <div class="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-white/40 mt-1.5 font-mono">Estimations Revealed</div>
        `;
        return;
    }

    // 4. Default State (Voting in progress)
    const votedCount = voters.filter(v => v.voted).length;
    el.innerHTML = `
        <div class="text-xl sm:text-2xl font-extrabold font-heading text-white dark:text-primary-dark animate-pulse">
            ${votedCount}/${voters.length}
        </div>
        <div class="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-white/50 mt-1 font-mono">VOTES CAST</div>
    `;
}

function updateVisualTimer() {
    if (state.sessionId && state.currentStory.includes('|')) {
        renderTableCenter();
    }
}

function startClientTimer() {
    if (clientTimer) clearInterval(clientTimer);
    clientTimer = setInterval(() => {
        if (!state.countdownActive) {
            updateVisualTimer();
        }
    }, 1000);
}

// Render entire game workspace elements dynamically
function renderGameWorkspace() {
    // Room details
    const [rawStoryName, _] = state.currentStory.split('|');
    const elRoomName = document.getElementById('game-room-name');
    const elRoomDeck = document.getElementById('game-room-deck');
    const elSelfName = document.getElementById('game-self-name');
    const elSelfRole = document.getElementById('game-self-role');
    
    if (elRoomName) elRoomName.textContent = state.sessionId;
    if (elRoomDeck) elRoomDeck.textContent = state.cardType;
    if (elSelfName) elSelfName.textContent = state.displayName;
    if (elSelfRole) elSelfRole.textContent = state.role;
    
    const activeStoryEl = document.getElementById('active-story-name');
    if (activeStoryEl) activeStoryEl.textContent = rawStoryName;

    // Host Actions Visibility
    const hostControls = document.getElementById('host-actions-container');
    const editStoryBtn = document.getElementById('edit-story-btn');
    if (state.isHost) {
        if (hostControls) hostControls.classList.remove('hidden');
        if (editStoryBtn) editStoryBtn.classList.remove('hidden');
    } else {
        if (hostControls) hostControls.classList.add('hidden');
        if (editStoryBtn) editStoryBtn.classList.add('hidden');
    }

    // Spectators vs Voter Layout controls
    const deckWorkspace = document.getElementById('deck-workspace-container');
    const mainContent = document.querySelector('main');
    
    if (state.role === 'spectator') {
        if (deckWorkspace) deckWorkspace.classList.add('hidden');
        if (mainContent) {
            mainContent.classList.remove('pb-[140px]');
        }
    } else {
        if (deckWorkspace) deckWorkspace.classList.remove('hidden');
        if (mainContent) {
            mainContent.classList.add('pb-[140px]');
        }
        renderEstimationDeck();
    }

    // Split into Voters and Spectators
    const voters = state.participants.filter(p => p.role === 'voter');
    const spectators = state.participants.filter(p => p.role === 'spectator');

    const voterCountBadge = document.getElementById('voter-count-badge');
    const spectatorCountBadge = document.getElementById('spectator-count-badge');
    if (voterCountBadge) voterCountBadge.textContent = voters.length;
    if (spectatorCountBadge) spectatorCountBadge.textContent = spectators.length;

    renderVotersGrid(voters);
    renderSpectators(spectators);
    renderHistoryStream();
}

// Helper to escape HTML characters safely
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Render Observers/Spectators Badges
function renderSpectators(spectators) {
    const list = document.getElementById('spectators-list');
    if (!list) return;

    if (spectators.length === 0) {
        list.innerHTML = `<span class="text-muted-slate/50 dark:text-text-dark/30 italic">No observers active</span>`;
        return;
    }

    list.innerHTML = spectators.map(s => {
        const isSelf = s.id === state.participantId;
        const selfClass = isSelf 
            ? "border-primary/50 text-primary dark:border-primary-dark/50 dark:text-primary-dark font-bold bg-primary/5 dark:bg-primary-dark/5" 
            : "border-outline-light text-text-light/80 dark:border-muted-slate/20 dark:text-text-dark/80 bg-surface-light/40 dark:bg-surface-dark/40";
        
        return `
            <span class="px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${selfClass}">
                <span class="material-symbols-outlined text-[12px] leading-none text-muted-slate dark:text-text-dark/50">visibility</span>
                ${escapeHTML(s.displayName)}
            </span>
        `;
    }).join('');
}

// Render Estimation History Stream dynamic timeline entries
function renderHistoryStream() {
    const container = document.getElementById('history-container');
    const exportBtn = document.getElementById('export-history-btn');
    if (!container) return;

    if (state.history.length === 0) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-muted-slate/50 dark:text-text-dark/30">
                <span class="material-symbols-outlined text-3xl mb-1.5 opacity-40">history</span>
                <span>No completed estimates yet in this session.</span>
            </div>
        `;
        if (exportBtn) exportBtn.disabled = true;
        return;
    }

    if (exportBtn) exportBtn.disabled = false;

    container.innerHTML = state.history.map((h, i) => {
        const date = new Date(h.createdAt);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="p-3.5 rounded-xl border border-outline-light/40 dark:border-muted-slate/10 bg-surface-light/45 dark:bg-surface-dark/45 hover:border-primary/20 dark:hover:border-primary-dark/25 transition-all flex flex-col gap-2 relative group overflow-hidden">
                <!-- Left-side decorative accent line -->
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 dark:bg-primary-dark/40"></div>
                
                <div class="flex justify-between items-start pl-2 gap-2">
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs font-bold text-text-light dark:text-text-dark truncate leading-tight group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">${escapeHTML(h.storyName)}</span>
                        <span class="text-[9px] text-muted-slate/75 dark:text-text-dark/40 font-semibold font-mono tracking-wider mt-1 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[10px] leading-none">schedule</span> ${timeStr}
                        </span>
                    </div>
                    <div class="flex flex-col items-end shrink-0">
                        <span class="px-2 py-1.5 rounded-lg bg-primary/10 dark:bg-primary-dark/10 border border-primary/20 dark:border-primary-dark/20 text-xs font-heading font-black text-primary dark:text-primary-dark min-w-[28px] text-center leading-none">
                            ${h.finalEstimate}
                        </span>
                    </div>
                </div>
                
                <!-- Individual voter details list -->
                <div class="pl-2 pt-1 border-t border-outline-light/10 dark:border-muted-slate/5 text-[10px] text-muted-slate dark:text-text-dark/50 flex flex-wrap gap-x-2 gap-y-0.5 font-mono select-none">
                    <span class="font-sans font-bold text-[9px] uppercase tracking-wider text-muted-slate/60 dark:text-text-dark/30">Votes:</span>
                    ${h.votes && h.votes.length > 0 
                        ? h.votes.map(v => `<span class="bg-surface-light dark:bg-surface-dark px-1.5 py-0.5 rounded border border-outline-light/20 dark:border-muted-slate/10">${escapeHTML(v.displayName)}:${v.vote}</span>`).join('')
                        : '<span class="italic text-muted-slate/40">none</span>'
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Render Estimation Deck grid (cards the estimator can click to vote)
function renderEstimationDeck() {
    const grid = document.getElementById('deck-grid');
    if (!grid) return;
    const values = DECKS[state.cardType] || DECKS.fibonacci;
    
    grid.innerHTML = values.map(val => {
        const isSelected = state.activeVote === val;
        
        // Arched in light, sharp in dark. Active cards scale slightly to hover.
        const modeClass = isSelected 
            ? "border-primary bg-primary text-white dark:border-primary-dark dark:bg-primary-dark dark:text-background-dark shadow-md scale-105"
            : "border-outline-light bg-surface-light text-text-light hover:border-primary hover:-translate-y-1 dark:border-muted-slate/30 dark:bg-surface-dark dark:text-text-dark dark:hover:border-primary-dark";
        
        const frameClass = "rounded-t-[14px] rounded-b-[4px]";

        return `
            <button onclick="submitVote('${val}')" class="estimation-card w-[48px] sm:w-[56px] aspect-[2/3] flex flex-col justify-between p-1.5 border-[2px] ${frameClass} ${modeClass} font-semibold transition-all select-none">
                <div class="text-[8px] text-left leading-none font-bold opacity-80">${val}</div>
                <div class="text-xl sm:text-2xl text-center leading-none font-heading py-1.5">${val}</div>
                <div class="text-[8px] text-right leading-none font-bold opacity-80">${val}</div>
            </button>
        `;
    }).join('');
}

// Submit vote to server
async function submitVote(val) {
    if (state.role !== 'voter') return;

    // If card clicked is already selected, click again to remove the vote
    const finalVote = (state.activeVote === val) ? null : val;

    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: state.participantId,
                vote: finalVote
            })
        });
        const data = await res.json();
        
        if (res.status === 404 || (data.error && data.error.includes("Participant not found"))) {
            handleParticipantSwept();
            return;
        }
        
        if (data.error) throw new Error(data.error);

        state.activeVote = data.vote;
        renderEstimationDeck();
        
        if (finalVote === null) {
            showToast("Cleared your estimate.", "info");
        } else {
            showToast(`Cast estimate: ${val}`, "success");
        }
        
        // Fast poll update to refresh grid instantly
        pollSession();
    } catch (err) {
        showToast(`Voting failed: ${err.message}`, "error");
    }
}

// Render Voters Roundtable Seats
function renderVotersGrid(voters) {
    const grid = document.getElementById('roundtable-seats');
    if (!grid) return;

    if (voters.length === 0) {
        grid.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white/50 z-20">
                No estimators seated. Share invite link below to invite players.
            </div>
        `;
        renderTableCenter();
        return;
    }

    // Sync status text and countdown logic
    const hasEveryoneVoted = voters.every(v => v.voted);
    const statusText = document.getElementById('voting-status-text');
    
    if (!statusText) return;

    if (state.revealed) {
        statusText.innerHTML = `<span class="text-emerald-500 font-bold">Votes revealed!</span>`;
    } else if (state.countdownActive) {
        statusText.innerHTML = `<span class="text-primary dark:text-primary-dark font-bold animate-pulse">REVEALING IN ${state.countdownSec}s...</span>`;
    } else if (hasEveryoneVoted) {
        statusText.innerHTML = `<span class="text-primary dark:text-primary-dark font-bold animate-bounce">Everyone has voted! Initiating reveal countdown...</span>`;
    } else {
        const votedCount = voters.filter(v => v.voted).length;
        statusText.textContent = `Voting in progress: ${votedCount}/${voters.length} voted`;
    }

    // Draw center of table
    renderTableCenter();

    // Radially position seats
    const N = voters.length;
    const rx = 44; // horizontal radius in percent
    const ry = 40; // vertical radius in percent

    grid.innerHTML = voters.map((v, i) => {
        const isSelf = v.id === state.participantId;
        const isHost = v.id === state.hostId;
        
        // Position math (Angle offset by -PI/2 to start at top)
        const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
        const x = 50 + rx * Math.cos(angle);
        const y = 50 + ry * Math.sin(angle);

        // Flip card configuration
        const showVote = state.revealed && v.vote !== null;
        const isCardFlipped = showVote ? "card-flipped" : "";
        
        // Border frame aesthetic (arch in both light and dark)
        const frameClass = "rounded-t-[18px] rounded-b-[6px]";

        // Back face (Golden Jali pattern face down)
        const backFaceDecor = v.voted 
            ? `<div class="w-full h-full flex flex-col justify-between p-2 jali-card-back ${frameClass}">
                 <div class="flex justify-between items-center w-full">
                    <span class="text-[8px] font-extrabold text-primary/70 dark:text-primary-dark/85">VOTED</span>
                    <span class="material-symbols-outlined text-[10px] text-primary dark:text-primary-dark animate-pulse">pending</span>
                 </div>
                 <div class="flex justify-center py-2">
                    <div class="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary-dark/10 flex items-center justify-center text-primary dark:text-primary-dark">
                        <span class="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                 </div>
                 <div class="text-[8px] text-center text-muted-slate/70 dark:text-text-dark/40 font-mono font-bold uppercase tracking-tighter">LOCKED</div>
               </div>`
            : `<div class="w-full h-full flex flex-col justify-between p-2 bg-surface-light/95 border-2 border-dashed border-primary/30 text-muted-slate dark:bg-surface-dark dark:border-primary-dark/30 dark:text-text-dark/50 ${frameClass} shadow-inner">
                  <div class="text-[7px] font-extrabold tracking-wider uppercase text-muted-slate/50 dark:text-text-dark/30">WAITING</div>
                  <div class="flex justify-center py-1 text-primary/30 dark:text-primary-dark/30">
                     <span class="material-symbols-outlined text-base leading-none animate-pulse">hourglass_empty</span>
                  </div>
                  <div class="text-[7px] text-center uppercase tracking-widest font-mono font-bold leading-none">Pending</div>
               </div>`;

        // Front face (Actual Vote result revealed)
        let frontFaceDecor = '';
        if (showVote) {
            frontFaceDecor = `
                <div class="w-full h-full flex flex-col justify-between p-2 bg-surface-light border-[2.5px] border-primary text-primary dark:bg-surface-dark dark:border-[2.5px] dark:border-primary-dark dark:text-primary-dark ${frameClass} shadow-md">
                    <div class="text-[8px] text-left leading-none font-bold">${v.vote}</div>
                    <div class="text-2xl text-center leading-none font-heading py-2">${v.vote}</div>
                    <div class="text-[8px] text-right leading-none font-bold">${v.vote}</div>
                </div>
            `;
        }

        // If voter has selected their own estimate but votes aren't revealed yet, show it locally!
        const showSelfPeek = !state.revealed && isSelf && v.vote !== null;
        const peekDecor = showSelfPeek 
            ? `<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary dark:bg-primary-dark text-white dark:text-background-dark px-1.5 py-0.2 rounded text-[8px] font-bold z-10 shadow border border-outline-light/20 whitespace-nowrap">
                 Peek: ${v.vote}
               </div>`
            : '';

        return `
            <div class="absolute flex flex-col items-center gap-1 w-14 sm:w-16 md:w-20 pointer-events-auto select-none" style="left: ${x}%; top: ${y}%; transform: translate(-50%, -50%);">
                ${peekDecor}
                <!-- 3D Card Slot -->
                <div class="theme-card-voter ${isCardFlipped} relative w-full aspect-[2/3]">
                    <div class="card-inner w-full h-full">
                        <!-- Card Face down (Back side of estimate card) -->
                        <div class="card-face w-full h-full">
                            ${backFaceDecor}
                        </div>
                        <!-- Card Face up (Front side of estimate card) -->
                        <div class="card-face card-back w-full h-full">
                            ${frontFaceDecor}
                        </div>
                    </div>
                </div>
                
                <!-- Participant Name Details -->
                <div class="flex flex-col items-center text-center w-full">
                    <div class="flex items-center justify-center gap-0.5 w-full">
                        <span class="font-bold text-[10px] truncate max-w-[50px] sm:max-w-[70px] text-text-light dark:text-text-dark">${v.displayName}</span>
                        ${isSelf ? `<span class="text-[7px] bg-primary/20 text-primary dark:bg-primary-dark/20 dark:text-primary-dark px-1 py-0.2 rounded font-semibold uppercase font-mono scale-90 leading-none">You</span>` : ''}
                    </div>
                    <div class="flex items-center gap-0.5 text-[8px] text-muted-slate dark:text-text-dark/45 font-mono leading-none">
                        ${isHost ? `<span class="material-symbols-outlined text-[8px] leading-none text-amber-500" style="font-variation-settings: 'FILL' 1;">stars</span> Host` : `Voter`}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}



// ==================== HOST MASTER ACTIONS ====================

// REVEAL Votes
async function triggerReveal() {
    if (!state.isHost) return;
    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/reveal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId: state.participantId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        state.revealed = true;
        showToast("All estimation estimates revealed!", "success");
        pollSession();
    } catch (err) {
        showToast(`Failed to reveal: ${err.message}`, "error");
    }
}

// RESET Votes
async function triggerReset() {
    if (!state.isHost) return;
    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId: state.participantId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        state.revealed = false;
        state.activeVote = null;
        showToast("Estimations reset for next round!", "info");
        pollSession();
    } catch (err) {
        showToast(`Failed to reset: ${err.message}`, "error");
    }
}

// Set active story Dialog controls
function openStoryEditModal() {
    const [rawStoryName, _] = state.currentStory.split('|');
    const modalStoryName = document.getElementById('modal-story-name');
    const modalStoryTimer = document.getElementById('modal-story-timer');
    const storyDialog = document.getElementById('story-edit-dialog');

    if (modalStoryName) modalStoryName.value = rawStoryName;
    if (modalStoryTimer) modalStoryTimer.value = 'none';
    if (storyDialog) storyDialog.showModal();
}

function closeStoryEditModal() {
    const storyDialog = document.getElementById('story-edit-dialog');
    if (storyDialog) storyDialog.close();
}

async function submitStoryEdit() {
    const modalStoryName = document.getElementById('modal-story-name');
    if (!modalStoryName) return;

    const storyName = modalStoryName.value.trim();
    if (!storyName) {
        showToast("Story name is required.", "warning");
        return;
    }

    const modalStoryTimer = document.getElementById('modal-story-timer');
    const timerSelect = modalStoryTimer ? modalStoryTimer.value : 'none';
    let finalStoryName = storyName;
    if (timerSelect !== 'none') {
        const secs = parseInt(timerSelect);
        const expiresAt = Date.now() + secs * 1000;
        finalStoryName = `${storyName}|${expiresAt}`;
    }

    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: state.participantId,
                storyName: finalStoryName
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        state.currentStory = data.storyName;
        state.revealed = false;
        state.activeVote = null;
        
        closeStoryEditModal();
        showToast("Updated active story and round state!", "success");
        pollSession();
    } catch (err) {
        showToast(`Story update failed: ${err.message}`, "error");
    }
}

// Save round to History Dialog controls
function openCompleteEstimateModal() {
    const titleEl = document.getElementById('modal-complete-story-title');
    const estimateInput = document.getElementById('modal-final-estimate');
    const completeDialog = document.getElementById('complete-estimate-dialog');
    
    if (!titleEl || !estimateInput || !completeDialog) return;

    const [rawStoryName, _] = state.currentStory.split('|');
    titleEl.textContent = rawStoryName;
    
    // Auto-calculate recommendation (e.g. average, mode, or simple estimation)
    const voters = state.participants.filter(p => p.role === 'voter' && p.vote !== null);
    if (voters.length > 0) {
        // If there is an obvious consensus, prefill it!
        const votesList = voters.map(v => v.vote);
        const mostFrequent = getMode(votesList);
        estimateInput.value = mostFrequent || votesList[0];
    } else {
        estimateInput.value = '';
    }

    completeDialog.showModal();
}

function closeCompleteEstimateModal() {
    const completeDialog = document.getElementById('complete-estimate-dialog');
    if (completeDialog) completeDialog.close();
}

async function submitCompleteEstimate() {
    const estimateInput = document.getElementById('modal-final-estimate');
    if (!estimateInput) return;

    const finalEstimate = estimateInput.value.trim();
    if (!finalEstimate) {
        showToast("Please enter the final agreed estimate.", "warning");
        return;
    }

    // Prepare voters payload for historic details
    const votesList = state.participants
        .filter(p => p.role === 'voter')
        .map(v => ({ displayName: v.displayName, vote: v.vote || 'N/A' }));

    const [rawStoryName, _] = state.currentStory.split('|');

    try {
        // 1. Post to history table
        const res = await fetch(`${API_BASE}/${state.sessionId}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: state.participantId,
                storyName: rawStoryName,
                finalEstimate,
                votes: votesList
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        closeCompleteEstimateModal();
        showToast(`Estimate logged successfully! Resetting round...`, "success");

        // 2. Automatically prompt host to type next story or reset round state
        const nextStoryGuess = incrementStoryNumber(rawStoryName);
        const updateRes = await fetch(`${API_BASE}/${state.sessionId}/story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: state.participantId,
                storyName: nextStoryGuess
            })
        });
        
        pollSession();
    } catch (err) {
        showToast(`Log history failed: ${err.message}`, "error");
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Graceful leave
async function handleLeaveSession() {
    stopPolling();
    if (state.sessionId && state.participantId) {
        try {
            await fetch(`${API_BASE}/${state.sessionId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: state.participantId })
            });
        } catch (e) {
            console.error("Leave request error:", e);
        }
    }
    
    // Clear storage
    sessionStorage.removeItem('poker_sessionId');
    sessionStorage.removeItem('poker_participantId');
    sessionStorage.removeItem('poker_displayName');
    sessionStorage.removeItem('poker_role');

    // Reset local state
    state = {
        sessionId: null,
        participantId: null,
        displayName: null,
        role: 'voter',
        isHost: false,
        activeVote: null,
        revealed: false,
        currentStory: '',
        cardType: 'fibonacci',
        participants: [],
        history: [],
        hostId: null
    };

    // Remove query params from URL
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

    showScreen('landing-screen');
    updateNavbarBadge(false);
    showToast("You left the session.", "info");
}

function resetToHome(e) {
    if (e) e.preventDefault();
    if (state.sessionId) {
        if (confirm("Are you sure you want to exit the current session?")) {
            handleLeaveSession();
        }
    } else {
        showScreen('landing-screen');
    }
}

function handleSessionNotFound() {
    stopPolling();
    showToast("Session not found or expired. Redirecting to home...", "error");
    setTimeout(() => {
        handleLeaveSession();
    }, 3000);
}

// Copy Share invitation link
function copyInvitationLink() {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${state.sessionId}`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
        showToast("Invitation link copied to clipboard!", "success");
    }).catch(err => {
        showToast("Failed to copy automatically. Copy: " + inviteUrl, "warning");
    });
}

// Local dynamic Toast system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    
    let colorClass = 'bg-white text-text-light border-outline-light/75 dark:bg-surface-dark dark:text-text-dark dark:border-muted-slate/30';
    let icon = 'info';

    if (type === 'success') {
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/30';
        icon = 'check_circle';
    } else if (type === 'error') {
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/30';
        icon = 'error';
    } else if (type === 'warning') {
        colorClass = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30';
        icon = 'warning';
    }

    toast.className = `flex items-center gap-3 p-4 rounded-xl border shadow-lg ${colorClass} transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto`;
    
    toast.innerHTML = `
        <span class="material-symbols-outlined text-xl leading-none font-bold">${icon}</span>
        <span class="text-xs font-semibold leading-normal">${message}</span>
    `;

    container.appendChild(toast);

    // Animate In
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Animate Out
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-1');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Export history stack to CSV format
function exportHistoryCSV() {
    if (state.history.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header Row
    csvContent += "Story Name,Final Estimate,Vote Breakdown,Timestamp\r\n";
    
    // Rows Data
    state.history.forEach(h => {
        const story = `"${h.storyName.replace(/"/g, '""')}"`;
        const estimate = `"${h.finalEstimate}"`;
        
        const breakdown = `"${h.votes.map(v => `${v.displayName}: ${v.vote}`).join(' | ')}"`;
        const time = `"${new Date(h.createdAt).toISOString()}"`;

        csvContent += `${story},${estimate},${breakdown},${time}\r\n`;
    });

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planning_poker_history_${state.sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Successfully exported estimation history to CSV!", "success");
}

// Increments numbers inside story titles (e.g. "Story 1" -> "Story 2")
function incrementStoryNumber(title) {
    const rx = /(\d+)/g;
    let m;
    let matches = [];
    while ((m = rx.exec(title)) !== null) {
        matches.push(m);
    }
    if (matches.length > 0) {
        // Increment the last matching digit sequence
        const last = matches[matches.length - 1];
        const nextNum = parseInt(last[0]) + 1;
        return title.substring(0, last.index) + nextNum + title.substring(last.index + last[0].length);
    }
    return title + " - Next Round";
}

// Calculates the Mode of a list of votes
function getMode(arr) {
    if (arr.length === 0) return null;
    let modeMap = {};
    let maxEl = arr[0], maxCount = 1;
    for (let i = 0; i < arr.length; i++) {
        let el = arr[i];
        if (modeMap[el] == null) modeMap[el] = 1;
        else modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}
