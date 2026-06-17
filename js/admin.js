import { setGlobalRound, unlockCurrentGame, addTeamBonus, clearAndStartR3, setR3State, awardR3Winners } from './db.js';

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
        console.error(error);
        statusText.innerText = `[ERROR]: DEPLOY FAILED`;
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
        console.error(error);
        statusText.innerText = `[ERROR]: UNLOCK FAILED`;
        statusText.style.color = "#ff003c";
    }
});

const btnInjectScore = document.getElementById('btn-inject-score');
const selectManualTriad = document.getElementById('manual-triad-select');
const inputManualPoints = document.getElementById('manual-points');
const overrideStatus = document.getElementById('override-status');

btnInjectScore.addEventListener('click', async () => {
    const triad = selectManualTriad.value;
    const points = parseInt(inputManualPoints.value);

    if (!triad || isNaN(points)) {
        overrideStatus.innerText = `[ERROR]: SELECT UNIT AND ENTER VALID POINTS.`;
        overrideStatus.style.color = "#ff003c";
        setTimeout(() => { overrideStatus.innerText = ''; }, 3000);
        return;
    }

    try {
        await addTeamBonus(triad, points);
        overrideStatus.innerText = `[SYSTEM]: ${points} PTS INJECTED TO ${triad}`;
        overrideStatus.style.color = "#0f0";
        inputManualPoints.value = '';
        setTimeout(() => { overrideStatus.innerText = ''; }, 3000);
    } catch (error) {
        console.error(error);
        overrideStatus.innerText = `[ERROR]: INJECTION FAILED`;
        overrideStatus.style.color = "#ff003c";
    }
});

const btnR3Input = document.getElementById('btn-r3-input');
const btnR3Vote = document.getElementById('btn-r3-vote');
const btnR3Award = document.getElementById('btn-r3-award');
const r3ImageIndex = document.getElementById('r3-image-index');
const r3Status = document.getElementById('r3-status');

btnR3Input.addEventListener('click', async () => {
    const idx = parseInt(r3ImageIndex.value);
    if(isNaN(idx)) return;
    await clearAndStartR3(idx);
    r3Status.innerText = `[SYSTEM]: ASSET ${idx} SUBMISSIONS OPEN`;
    r3Status.style.color = "#14B8A6";
    setTimeout(() => { setR3State('wait'); r3Status.innerText = `[SYSTEM]: SUBMISSIONS CLOSED`; }, 40000);
});

btnR3Vote.addEventListener('click', async () => {
    await setR3State('vote');
    r3Status.innerText = `[SYSTEM]: VOTING OPEN`;
    r3Status.style.color = "#ff003c";
    setTimeout(() => { setR3State('wait'); r3Status.innerText = `[SYSTEM]: VOTING CLOSED`; }, 30000);
});

btnR3Award.addEventListener('click', async () => {
    await awardR3Winners();
    r3Status.innerText = `[SYSTEM]: POINTS INJECTED TO TOP 3`;
    r3Status.style.color = "#0f0";
});