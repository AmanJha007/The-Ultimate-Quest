import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore, doc, setDoc, onSnapshot, collection, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDkUA9Ws1q7yByKn-qICSBrSVIQgUckFOw",
    authDomain: "phantom-protocol-8b3f3.firebaseapp.com",
    projectId: "phantom-protocol-8b3f3",
    storageBucket: "phantom-protocol-8b3f3.firebasestorage.app",
    messagingSenderId: "331865995163",
    appId: "1:331865995163:web:b0d2710410548f147e533e"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

export async function syncPlayerToCloud(triad, alias) {
    const playerRef = doc(db, "players", `${triad}_${alias}`);
    await setDoc(playerRef, {
        triad: triad,
        alias: alias,
        lastActive: Date.now(),
        scores: {}
    }, { merge: true });
}

export function listenToLeaderboard(callback) {
    const q = query(collection(db, "players"));
    return onSnapshot(q, (snapshot) => {
        const teamScores = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            const triad = data.triad;
            let playerTotal = 0;
            if (data.scores) {
                for (const gameId in data.scores) {
                    playerTotal += data.scores[gameId] || 0;
                }
            }
            if (!teamScores[triad]) {
                teamScores[triad] = 0;
            }
            teamScores[triad] += playerTotal;
        });
        callback(teamScores);
    });
}

export async function updatePlayerScore(gameId, score) {
    const sessionData = localStorage.getItem('phantom_session');
    if (!sessionData) return;
    const user = JSON.parse(sessionData);
    const playerRef = doc(db, "players", `${user.triad}_${user.alias}`);
    await setDoc(playerRef, {
        scores: {
            [gameId]: score
        },
        lastActive: Date.now()
    }, { merge: true });
}

export async function setGlobalRound(roundNumber) {
    const eventRef = doc(db, "admin", "gameState");
    // This deploys the round but keeps the Play button locked
    await setDoc(eventRef, { currentRound: roundNumber, gameActive: false }, { merge: true });
}

export async function unlockCurrentGame() {
    const eventRef = doc(db, "admin", "gameState");
    // This signals the iframe games to unlock their Play buttons
    await setDoc(eventRef, { gameActive: true }, { merge: true });
}

export function listenToGlobalState(callback) {
    const eventRef = doc(db, "admin", "gameState");
    return onSnapshot(eventRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().currentRound);
        }
    });
}