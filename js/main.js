import { eventConfig } from './config.js';
import { listenToLeaderboard, updatePlayerScore, listenToGlobalState } from './db.js';

// ============================================================
// STATE TRACKING — stored in localStorage so it survives refresh
// ============================================================

function getCompletedGames() {
    try { return JSON.parse(localStorage.getItem('completed_games') || '[]'); }
    catch(e) { return []; }
}

function getStartedGames() {
    try { return JSON.parse(localStorage.getItem('started_games') || '[]'); }
    catch(e) { return []; }
}

function markGameStarted(gameId) {
    const started = getStartedGames();
    if (!started.includes(gameId)) {
        started.push(gameId);
        localStorage.setItem('started_games', JSON.stringify(started));
    }
    // Update the button immediately to "IN PROGRESS" state
    setButtonState(gameId, 'playing');
}

function markGameCompleted(gameId) {
    const completed = getCompletedGames();
    if (!completed.includes(gameId)) {
        completed.push(gameId);
        localStorage.setItem('completed_games', JSON.stringify(completed));
    }
    // Update button to "COMPLETED" state and blank the iframe
    setButtonState(gameId, 'done');
    const frame = document.getElementById('game-frame');
    if (frame) frame.src = '';
}

// ============================================================
// BUTTON STATE UPDATER — 3 states: available / playing / done
// ============================================================

function setButtonState(gameId, state) {
    const launcher = document.getElementById('game-launcher');
    if (!launcher) return;

    launcher.querySelectorAll('.game-btn').forEach(btn => {
        if (btn.dataset.gameId !== gameId) return;

        btn.disabled = true; // lock in all non-available states

        if (state === 'playing') {
            btn.textContent = `▶ ${btn.dataset.gameTitle} — IN PROGRESS`;
            btn.style.opacity     = '0.6';
            btn.style.cursor      = 'not-allowed';
            btn.style.color       = '#ffd700';   // yellow = active
            btn.style.borderColor = '#ffd700';
        } else if (state === 'done') {
            btn.textContent = `✓ ${btn.dataset.gameTitle} — COMPLETED`;
            btn.style.opacity     = '0.45';
            btn.style.cursor      = 'not-allowed';
            btn.style.color       = '#008f11';   // dim green = finished
            btn.style.borderColor = '#008f11';
        }
    });

    // Show / update the status message below the launcher
    updateStatusMessage(gameId, state);
}

function updateStatusMessage(gameId, state) {
    const launcher = document.getElementById('game-launcher');
    if (!launcher) return;

    let msg = document.getElementById('round-status-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'round-status-msg';
        msg.style.cssText = 'padding:12px; margin-top:10px; border:1px dashed; font-size:0.9rem; letter-spacing:0.1em;';
        launcher.insertAdjacentElement('afterend', msg);
    }

    if (state === 'playing') {
        msg.style.color       = '#ffd700';
        msg.style.borderColor = '#ffd700';
        msg.textContent = '⚠ ROUND IN PROGRESS — DO NOT CLICK THE GAME NAME OR IT WILL RESTART';
    } else if (state === 'done') {
        msg.style.color       = '#008f11';
        msg.style.borderColor = '#008f11';
        msg.textContent = '⏳ ROUND COMPLETE — AWAITING ADMIN INSTRUCTIONS...';
    }
}

// ============================================================
// RENDER GAME BUTTONS — checks state and sets correct button
// ============================================================

function renderGameSelector(currentRound) {
    const launcher = document.getElementById('game-launcher');
    const activeGames = eventConfig.rounds[currentRound];
    launcher.innerHTML = '';

    // Clear previous status message
    const oldMsg = document.getElementById('round-status-msg');
    if (oldMsg) oldMsg.remove();

    if (!activeGames) return;

    const completedGames = getCompletedGames();
    const startedGames   = getStartedGames();

    activeGames.forEach(game => {
        const btn = document.createElement('button');
        btn.classList.add('game-btn');
        btn.dataset.gameId    = game.id;
        btn.dataset.gameTitle = game.title;

        if (completedGames.includes(game.id)) {
            // ── COMPLETED — locked, dim green ──
            btn.textContent       = `✓ ${game.title} — COMPLETED`;
            btn.disabled          = true;
            btn.style.opacity     = '0.45';
            btn.style.cursor      = 'not-allowed';
            btn.style.color       = '#008f11';
            btn.style.borderColor = '#008f11';
            showStatusMsg('done');

        } else if (startedGames.includes(game.id)) {
            // ── IN PROGRESS — locked, yellow ──
            // Player started this game before refresh — keep locked
            btn.textContent       = `▶ ${game.title} — IN PROGRESS`;
            btn.disabled          = true;
            btn.style.opacity     = '0.6';
            btn.style.cursor      = 'not-allowed';
            btn.style.color       = '#ffd700';
            btn.style.borderColor = '#ffd700';
            showStatusMsg('playing');

        } else {
            // ── AVAILABLE — normal clickable ──
            btn.textContent = game.title;
            btn.addEventListener('click', () => {
                // Mark as started BEFORE loading the iframe
                markGameStarted(game.id);
                document.getElementById('game-frame').src = game.path;
            });
        }

        launcher.appendChild(btn);
    });
}

// Helper to show status message without needing a button reference
function showStatusMsg(state) {
    const launcher = document.getElementById('game-launcher');
    if (!launcher) return;
    let msg = document.getElementById('round-status-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'round-status-msg';
        msg.style.cssText = 'padding:12px; margin-top:10px; border:1px dashed; font-size:0.9rem; letter-spacing:0.1em;';
        launcher.insertAdjacentElement('afterend', msg);
    }
    if (state === 'playing') {
        msg.style.color = '#ffd700'; msg.style.borderColor = '#ffd700';
        msg.textContent = '⚠ ROUND IN PROGRESS — DO NOT CLICK THE GAME NAME OR IT WILL RESTART';
    } else {
        msg.style.color = '#008f11'; msg.style.borderColor = '#008f11';
        msg.textContent = '⏳ ROUND COMPLETE — AWAITING ADMIN INSTRUCTIONS...';
    }
}

// ============================================================
// LEADERBOARD
// ============================================================

function updateLeaderboardUI(teamScores) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    const sortedTeams = Object.entries(teamScores).sort((a, b) => b[1] - a[1]);
    sortedTeams.forEach(([team, score]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>UNIT ${team.replace('T', '')}</span> <span>${score} PTS</span>`;
        list.appendChild(li);
    });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    listenToLeaderboard(updateLeaderboardUI);
    listenToGlobalState((round) => {
        renderGameSelector(round || 1);
    });
});

// ============================================================
// MESSAGE LISTENER — from game iframe
// ============================================================

window.addEventListener('message', async (event) => {

    // Per-question score update
    if (event.data && event.data.type === 'PHANTOM_SCORE_UPDATE') {
        const gameId = event.data.gameId;
        const score  = event.data.score;

        await updatePlayerScore(gameId, score);

        const terminalOutput = document.createElement('div');
        terminalOutput.style.cssText = 'color:var(--accent); padding:10px;';
        terminalOutput.innerText = `[SYSTEM]: Score registered for ${gameId} -> ${score} PTS`;
        document.getElementById('game-stage').appendChild(terminalOutput);
        setTimeout(() => terminalOutput.remove(), 3000);
    }

    // Round finished — lock button permanently as COMPLETED
    if (event.data && event.data.type === 'ROUND_COMPLETE') {
        markGameCompleted(event.data.gameId);
    }
});