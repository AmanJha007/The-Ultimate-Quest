import { eventConfig } from './config.js';
import { listenToLeaderboard, updatePlayerScore, listenToGlobalState } from './db.js';

function renderGameSelector(currentRound) {
    const launcher = document.getElementById('game-launcher');
    const activeGames = eventConfig.rounds[currentRound];
    launcher.innerHTML = '';

    if (!activeGames) return;

    activeGames.forEach(game => {
        const btn = document.createElement('button');
        btn.textContent = game.title;
        btn.classList.add('game-btn');
        btn.addEventListener('click', () => {
            document.getElementById('game-frame').src = game.path;
        });
        launcher.appendChild(btn);
    });
}

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

document.addEventListener('DOMContentLoaded', () => {
    listenToLeaderboard(updateLeaderboardUI);
    
    listenToGlobalState((round) => {
        if (round) {
            renderGameSelector(round);
        } else {
            renderGameSelector(1);
        }
    });
});

window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'PHANTOM_SCORE_UPDATE') {
        const gameId = event.data.gameId;
        const score = event.data.score;
        
        await updatePlayerScore(gameId, score);
        
        const terminalOutput = document.createElement('div');
        terminalOutput.style.color = "var(--accent)";
        terminalOutput.style.padding = "10px";
        terminalOutput.innerText = `[SYSTEM]: Score registered for ${gameId} -> ${score} PTS`;
        document.getElementById('game-stage').appendChild(terminalOutput);
        
        setTimeout(() => terminalOutput.remove(), 3000);
    }
});