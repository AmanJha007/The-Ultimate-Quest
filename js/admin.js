import { setGlobalRound, unlockCurrentGame, lockGame, addTeamBonus, clearAndStartR3, setR3State, awardR3Winners, getAllPlayers } from './db.js';

// ═══════════════════════════════════════
// PANEL 1: Round Control
// ═══════════════════════════════════════
const btnSetRound   = document.getElementById('btn-set-round');
const btnUnlockGame = document.getElementById('btn-unlock-game');
const btnQuickDeploy= document.getElementById('btn-quick-deploy');
const btnLockGame   = document.getElementById('btn-lock-game');
const selectRound   = document.getElementById('round-select');
const statusText    = document.getElementById('admin-status');

function showStatus(el, msg, color, duration) {
    el.innerText = msg;
    el.style.color = color || '#0f0';
    if (duration) setTimeout(() => { el.innerText = ''; }, duration);
}

btnSetRound.addEventListener('click', async () => {
    try {
        const round = parseInt(selectRound.value);
        await setGlobalRound(round);
        showStatus(statusText, `✅ ROUND ${round} DEPLOYED (LOCKED)`, '#0f0', 4000);
    } catch (e) {
        console.error(e);
        showStatus(statusText, `❌ DEPLOY FAILED`, '#ff003c', 4000);
    }
});

btnUnlockGame.addEventListener('click', async () => {
    try {
        await unlockCurrentGame();
        showStatus(statusText, `✅ GAME UNLOCKED FOR PLAYERS`, '#14B8A6', 4000);
    } catch (e) {
        console.error(e);
        showStatus(statusText, `❌ UNLOCK FAILED`, '#ff003c', 4000);
    }
});

// ── Quick Deploy + Unlock (one click) ──
btnQuickDeploy.addEventListener('click', async () => {
    try {
        const round = parseInt(selectRound.value);
        showStatus(statusText, `⚡ DEPLOYING ROUND ${round}...`, '#ffd700');
        await setGlobalRound(round);
        // Small delay so clients pick up the round change before unlock
        await new Promise(r => setTimeout(r, 500));
        await unlockCurrentGame();
        showStatus(statusText, `✅ ROUND ${round} LIVE — PLAYERS CAN PLAY`, '#0f0', 5000);
    } catch (e) {
        console.error(e);
        showStatus(statusText, `❌ QUICK DEPLOY FAILED`, '#ff003c', 4000);
    }
});

// ── Emergency Lock ──
btnLockGame.addEventListener('click', async () => {
    try {
        await lockGame();
        showStatus(statusText, `🔒 GAME LOCKED — ALL PLAYERS FROZEN`, '#ff003c', 5000);
    } catch (e) {
        console.error(e);
        showStatus(statusText, `❌ LOCK FAILED`, '#ff003c', 4000);
    }
});

// ═══════════════════════════════════════
// PANEL 2: Manual Score Injection
// ═══════════════════════════════════════
const btnInjectScore    = document.getElementById('btn-inject-score');
const selectManualTriad = document.getElementById('manual-triad-select');
const inputManualPoints = document.getElementById('manual-points');
const overrideStatus    = document.getElementById('override-status');

btnInjectScore.addEventListener('click', async () => {
    const triad  = selectManualTriad.value;
    const points = parseInt(inputManualPoints.value);

    if (!triad || isNaN(points)) {
        showStatus(overrideStatus, `⚠ SELECT UNIT AND ENTER VALID POINTS`, '#ff003c', 3000);
        return;
    }

    try {
        await addTeamBonus(triad, points);
        showStatus(overrideStatus, `✅ ${points} PTS INJECTED → ${triad}`, '#0f0', 4000);
        inputManualPoints.value = '';
    } catch (e) {
        console.error(e);
        showStatus(overrideStatus, `❌ INJECTION FAILED`, '#ff003c', 4000);
    }
});

// ═══════════════════════════════════════
// PANEL 3: Round 3 Controls
// ═══════════════════════════════════════
const btnR3Input    = document.getElementById('btn-r3-input');
const btnR3Vote     = document.getElementById('btn-r3-vote');
const btnR3Award    = document.getElementById('btn-r3-award');
const r3ImageIndex  = document.getElementById('r3-image-index');
const r3Status      = document.getElementById('r3-status');

let r3SubmissionTimer = null;
let r3VotingTimer     = null;

btnR3Input.addEventListener('click', async () => {
    const idx = parseInt(r3ImageIndex.value);
    if (isNaN(idx) || idx < 1 || idx > 14) {
        showStatus(r3Status, `⚠ ENTER IMAGE NUMBER 1–14`, '#ff003c', 3000);
        return;
    }
    try {
        await clearAndStartR3(idx);
        showStatus(r3Status, `✅ IMAGE ${idx} — SUBMISSIONS OPEN (40s)`, '#14B8A6');

        // Auto-close submissions after 40s
        clearTimeout(r3SubmissionTimer);
        r3SubmissionTimer = setTimeout(async () => {
            await setR3State('wait');
            showStatus(r3Status, `🔒 SUBMISSIONS CLOSED — READY FOR VOTING`, '#ffd700');
        }, 40000);
    } catch (e) {
        console.error(e);
        showStatus(r3Status, `❌ FAILED TO START`, '#ff003c', 4000);
    }
});

btnR3Vote.addEventListener('click', async () => {
    try {
        await setR3State('vote');
        showStatus(r3Status, `✅ VOTING OPEN (30s)`, '#ff003c');

        // Auto-close voting after 30s
        clearTimeout(r3VotingTimer);
        r3VotingTimer = setTimeout(async () => {
            await setR3State('wait');
            showStatus(r3Status, `🔒 VOTING CLOSED — READY TO AWARD`, '#ffd700');
        }, 30000);
    } catch (e) {
        console.error(e);
        showStatus(r3Status, `❌ FAILED TO START VOTING`, '#ff003c', 4000);
    }
});

btnR3Award.addEventListener('click', async () => {
    try {
        await awardR3Winners();
        showStatus(r3Status, `✅ POINTS AWARDED TO TOP 3`, '#0f0', 5000);
    } catch (e) {
        console.error(e);
        showStatus(r3Status, `❌ AWARD FAILED`, '#ff003c', 4000);
    }
});

// ═══════════════════════════════════════
// PANEL 4: Player Monitor
// ═══════════════════════════════════════
const btnViewPlayers  = document.getElementById('btn-view-players');
const playerListDiv   = document.getElementById('player-list');
const playerContainer = document.getElementById('player-list-container');
const playerCountDiv  = document.getElementById('player-count');
const monitorStatus   = document.getElementById('monitor-status');

btnViewPlayers.addEventListener('click', async () => {
    try {
        showStatus(monitorStatus, '⏳ LOADING...', '#ffd700');
        const players = await getAllPlayers();

        // Count real players (not manual bonus entries)
        const realPlayers = players.filter(p => p.alias !== 'JUDGE_OVERRIDE');

        playerCountDiv.textContent = `REGISTERED: ${realPlayers.length} OPERATORS`;
        playerListDiv.innerHTML = '';

        if (realPlayers.length === 0) {
            playerListDiv.innerHTML = '<div style="color:#008f11; padding:10px;">No players registered yet.</div>';
        } else {
            realPlayers.forEach(p => {
                const row = document.createElement('div');
                row.className = 'player-row';
                row.innerHTML =
                    `<span class="player-triad">${p.triad}</span>` +
                    `<span class="player-alias">${p.alias}</span>` +
                    `<span class="player-score">${p.totalScore} PTS</span>`;
                playerListDiv.appendChild(row);
            });
        }

        playerContainer.style.display = 'block';
        showStatus(monitorStatus, '', '#0f0');
    } catch (e) {
        console.error(e);
        showStatus(monitorStatus, `❌ FAILED TO LOAD PLAYERS`, '#ff003c', 4000);
    }
});