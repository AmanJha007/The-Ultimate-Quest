import { syncPlayerToCloud, getTeamCount, playerExists, listenToTeamMembers } from './db.js';

const gate        = document.getElementById('access-gate');
const btnLogin    = document.getElementById('btn-login');
const selectTriad = document.getElementById('triad-select');
const inputAlias  = document.getElementById('player-alias');
const teamDisplay = document.getElementById('team-info');
const loginMsg    = document.getElementById('login-msg');

// ── Status message on login screen ──
function setLoginMsg(text, color) {
    if (loginMsg) {
        loginMsg.textContent = text;
        loginMsg.style.color = color || '#ff003c';
    }
}

// ── Auto-login from previous session ──
function checkAuth() {
    const sessionData = localStorage.getItem('phantom_session');
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            if (user && user.triad && user.alias) {
                unlockTerminal(user.triad, user.alias);
            }
        } catch (e) {
            localStorage.removeItem('phantom_session');
        }
    }
}

// ── Open the main app ──
function unlockTerminal(triad, alias) {
    gate.style.display = 'none';
    teamDisplay.innerHTML = `<span>UNIT: ${triad}</span> | <span>OP: ${alias}</span>`;
    syncPlayerToCloud(triad, alias);

    // ── Real-time squad member list ──
    listenToTeamMembers(triad, (members) => {
        const squadList = members.join(' • ');
        teamDisplay.innerHTML =
            `<span style="color:#0f0;">UNIT: ${triad}</span> ` +
            `<span style="color:#008f11;">|</span> ` +
            `<span style="color:#0f0;">OP: ${alias}</span>` +
            `<br>` +
            `<span style="font-size:0.65rem; color:#14B8A6; letter-spacing:0.1em;">` +
            `SQUAD [${members.length}/3]: ${squadList}` +
            `</span>`;
    });
}

// ── Login button click — with 3-member limit ──
btnLogin.addEventListener('click', async () => {
    const triad = selectTriad.value;
    const alias = inputAlias.value.trim().toUpperCase();

    if (!triad || triad === '') {
        setLoginMsg('⚠ SELECT YOUR UNIT FIRST');
        return;
    }
    if (!alias || alias === '') {
        setLoginMsg('⚠ ENTER YOUR ALIAS FIRST');
        return;
    }

    // Show loading state
    setLoginMsg('VERIFYING CLEARANCE...', '#ffd700');
    btnLogin.disabled = true;
    btnLogin.textContent = 'VERIFYING...';

    try {
        // Check if this exact player already exists (returning player = always allowed)
        const exists = await playerExists(triad, alias);

        if (!exists) {
            // New player — check 3-member limit
            const count = await getTeamCount(triad);
            if (count >= 3) {
                setLoginMsg(`⛔ UNIT ${triad} IS FULL — MAX 3 OPERATORS ALLOWED`);
                btnLogin.disabled = false;
                btnLogin.textContent = 'INITIATE SEQUENCE';
                return;
            }
        }

        // All clear — save session and enter
        const userData = { triad, alias, loginTime: Date.now() };
        localStorage.setItem('phantom_session', JSON.stringify(userData));
        unlockTerminal(triad, alias);

    } catch (err) {
        console.error('Login error:', err);
        setLoginMsg('⚠ CONNECTION ERROR — TRY AGAIN', '#ff003c');
        btnLogin.disabled = false;
        btnLogin.textContent = 'INITIATE SEQUENCE';
    }
});

document.addEventListener('DOMContentLoaded', checkAuth);