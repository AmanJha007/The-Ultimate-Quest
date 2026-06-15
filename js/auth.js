import { syncPlayerToCloud } from './db.js';

const gate = document.getElementById('access-gate');
const btnLogin = document.getElementById('btn-login');
const selectTriad = document.getElementById('triad-select');
const inputAlias = document.getElementById('player-alias');
const teamDisplay = document.getElementById('team-info');

function checkAuth() {
    const sessionData = localStorage.getItem('phantom_session');
    if (sessionData) {
        const user = JSON.parse(sessionData);
        unlockTerminal(user.triad, user.alias);
    }
}

function unlockTerminal(triad, alias) {
    gate.style.display = 'none';
    teamDisplay.innerHTML = `<span>UNIT: ${triad}</span> | <span>OP: ${alias}</span>`;
    syncPlayerToCloud(triad, alias);
}

btnLogin.addEventListener('click', () => {
    const triad = selectTriad.value;
    const alias = inputAlias.value.trim().toUpperCase();

    if (!triad || alias === '') {
        alert("CRITICAL ERROR: MISSING IDENTIFICATION DATA");
        return;
    }

    const userData = {
        triad: triad,
        alias: alias,
        loginTime: Date.now()
    };

    localStorage.setItem('phantom_session', JSON.stringify(userData));
    unlockTerminal(triad, alias);
});

document.addEventListener('DOMContentLoaded', checkAuth);