import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore, doc, setDoc, onSnapshot, collection, query, increment, getDocs, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ════════════════════════════════════════════════════════════
// 🔴 CRITICAL FIX: syncPlayerToCloud no longer resets scores
// ════════════════════════════════════════════════════════════
export async function syncPlayerToCloud(triad, alias) {
    const playerRef = doc(db, "players", `${triad}_${alias}`);
    const docSnap = await getDoc(playerRef);

    if (docSnap.exists()) {
        // Player already exists — ONLY update lastActive
        // DO NOT set scores:{} — that was wiping all points!
        await setDoc(playerRef, { lastActive: Date.now() }, { merge: true });
    } else {
        // Brand new player — create with empty scores
        await setDoc(playerRef, {
            triad: triad,
            alias: alias,
            lastActive: Date.now(),
            scores: {}
        });
    }
}

// ════════════════════════════════════════════════════════════
// NEW: Check if a specific player already exists
// ════════════════════════════════════════════════════════════
export async function playerExists(triad, alias) {
    const playerRef = doc(db, "players", `${triad}_${alias}`);
    const docSnap = await getDoc(playerRef);
    return docSnap.exists();
}

// ════════════════════════════════════════════════════════════
// NEW: Count members in a triad (for 3-member limit)
// ════════════════════════════════════════════════════════════
export async function getTeamCount(triad) {
    const snapshot = await getDocs(collection(db, "players"));
    let count = 0;
    snapshot.forEach(d => {
        const data = d.data();
        if (data.triad === triad && data.alias !== 'JUDGE_OVERRIDE') count++;
    });
    return count;
}

// ════════════════════════════════════════════════════════════
// NEW: Real-time listener for team member names
// ════════════════════════════════════════════════════════════
export function listenToTeamMembers(triad, callback) {
    return onSnapshot(collection(db, "players"), (snapshot) => {
        const members = [];
        snapshot.forEach(d => {
            const data = d.data();
            if (data.triad === triad && data.alias !== 'JUDGE_OVERRIDE') {
                members.push(data.alias);
            }
        });
        callback(members);
    });
}

// ════════════════════════════════════════════════════════════
// NEW: Lock game (admin emergency stop)
// ════════════════════════════════════════════════════════════
export async function lockGame() {
    const eventRef = doc(db, "admin", "gameState");
    await setDoc(eventRef, { gameActive: false }, { merge: true });
}

// ════════════════════════════════════════════════════════════
// NEW: Get all players with scores (for admin dashboard)
// ════════════════════════════════════════════════════════════
export async function getAllPlayers() {
    const snapshot = await getDocs(collection(db, "players"));
    const players = [];
    snapshot.forEach(d => {
        const data = d.data();
        let totalScore = 0;
        if (data.scores) {
            for (const key in data.scores) {
                totalScore += data.scores[key] || 0;
            }
        }
        players.push({
            id: d.id,
            triad: data.triad || '?',
            alias: data.alias || '?',
            totalScore: totalScore,
            scores: data.scores || {}
        });
    });
    // Sort by triad then alias
    players.sort((a, b) => {
        if (a.triad < b.triad) return -1;
        if (a.triad > b.triad) return 1;
        return (a.alias || '').localeCompare(b.alias || '');
    });
    return players;
}

// ════════════════════════════════════════════════════════════
// EXISTING: Leaderboard listener
// ════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════
// EXISTING: Update player score (per-question)
// ════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════
// EXISTING: Admin round/game state controls
// ════════════════════════════════════════════════════════════
export async function setGlobalRound(roundNumber) {
    const eventRef = doc(db, "admin", "gameState");
    await setDoc(eventRef, { currentRound: roundNumber, gameActive: false }, { merge: true });
}

export async function unlockCurrentGame() {
    const eventRef = doc(db, "admin", "gameState");
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

export async function addTeamBonus(triad, points) {
    const teamRef = doc(db, "players", `${triad}_MANUAL_BONUS`);
    await setDoc(teamRef, {
        triad: triad,
        alias: "JUDGE_OVERRIDE",
        lastActive: Date.now(),
        scores: {
            hunt_points: increment(points)
        }
    }, { merge: true });
}

export async function submitR3Caption(caption) {
    const sessionData = localStorage.getItem('phantom_session');
    if (!sessionData) return;
    const user = JSON.parse(sessionData);
    const capRef = doc(db, "r3_captions", user.triad);
    
    const docSnap = await getDoc(capRef);
    if (docSnap.exists()) return;

    await setDoc(capRef, {
        triad: user.triad,
        alias: user.alias,
        caption: caption,
        votes: 0,
        timestamp: Date.now()
    });
}

export async function submitR3Vote(votedTriad) {
    const capRef = doc(db, "r3_captions", votedTriad);
    await setDoc(capRef, { votes: increment(1) }, { merge: true });
}

export async function setR3State(phase) {
    const eventRef = doc(db, "admin", "gameState");
    await setDoc(eventRef, { r3Phase: phase }, { merge: true });
}

export async function clearAndStartR3(imageIndex) {
    const snapshot = await getDocs(collection(db, "r3_captions"));
    const deletePromises = [];
    snapshot.forEach((d) => {
        deletePromises.push(deleteDoc(doc(db, "r3_captions", d.id)));
    });
    await Promise.all(deletePromises);
    const eventRef = doc(db, "admin", "gameState");
    await setDoc(eventRef, { r3Phase: 'input', r3ImageIndex: imageIndex }, { merge: true });
}

export async function awardR3Winners() {
    const snapshot = await getDocs(collection(db, "r3_captions"));
    const captions = [];
    snapshot.forEach((d) => captions.push(d.data()));
    
    captions.sort((a, b) => {
        if (b.votes === a.votes) {
            return (a.timestamp || 0) - (b.timestamp || 0);
        }
        return b.votes - a.votes;
    });
    
    const top3 = captions.slice(0, 3);
    const points = [10, 7, 5];
    
    for (let i = 0; i < top3.length; i++) {
        if (top3[i] && top3[i].votes > 0) {
            await addTeamBonus(top3[i].triad, points[i]);
        }
    }
}