import { setGlobalRound, unlockCurrentGame } from './db.js';

const btnSetRound = document.getElementById('btn-set-round');
const btnUnlockGame = document.getElementById('btn-unlock-game');
const selectRound = document.getElementById('round-select');
const statusText = document.getElementById('admin-status');

btnSetRound.addEventListener('click', async () => {
    try {
        const round = parseInt(selectRound.value);
        await setGlobalRound(round);
        statusText.innerText = `[SYSTEM]: ROUND ${round} DEPLOYED (LOCKED)`;
        statusText.style.color = "#0f0";
        setTimeout(() => { statusText.innerText = ''; }, 3000);
    } catch (error) {
        console.error("Firebase Error:", error);
        statusText.innerText = `[ERROR]: DEPLOY FAILED. CHECK CONSOLE.`;
        statusText.style.color = "#ff003c";
    }
});

btnUnlockGame.addEventListener('click', async () => {
    try {
        await unlockCurrentGame();
        statusText.innerText = `[SYSTEM]: GAME UNLOCKED FOR PLAYERS`;
        statusText.style.color = "#14B8A6";
        setTimeout(() => { statusText.innerText = ''; }, 3000);
    } catch (error) {
        console.error("Firebase Error:", error);
        statusText.innerText = `[ERROR]: UNLOCK FAILED. CHECK CONSOLE.`;
        statusText.style.color = "#ff003c";
    }
});