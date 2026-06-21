# 🎮 The Ultimate Quest: Think Create Pitch

> A real-time multiplayer event game platform built for live college events — featuring quiz battles, scavenger hunts, witty captions, and pitch competitions with 60+ simultaneous participants.

🔗 **Live:** [the-ultimate-quest.vercel.app](https://the-ultimate-quest.vercel.app)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **4-Round Game System** | Quiz, Scavenger Hunt, Witty Captions, Shark Tank |
| 📊 **Live Leaderboard** | Real-time score updates across all teams using Firebase |
| 🔒 **Anti-Cheat System** | 3-state button lock prevents round replay & score farming |
| 🎛️ **Admin Dashboard** | Deploy rounds, inject scores, emergency lock, monitor players |
| 📱 **Mobile Responsive** | Fully optimized for smartphone gameplay |
| 👥 **3-Member Team Limit** | Auto-enforced team size with live squad display |
| ⚡ **Score Persistence** | Points survive page refreshes — no data loss |
| 🎨 **Hacker Terminal UI** | Matrix-inspired dark theme with glowing green aesthetics |

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5 / CSS3 / JavaScript** | Core frontend |
| **Firebase Firestore** | Real-time database for scores, game state, captions |
| **Vercel** | Deployment & hosting with CI/CD |
| **GitHub** | Version control & collaboration |

---

## 🎮 Game Rounds

### Round 1: Kahoot Quiz
- 12 rapid-fire questions with 10-second timer
- Speed-based scoring (faster answer = more points)
- Options lock after selection

### Round 2: Scavenger Hunt
- 8 timed tasks (60s each) with progress dots
- Colour-coded timer (🟢 → 🟡 → 🔴)
- Photo proof submitted via WhatsApp

### Round 3: Witty Captions
- Admin-controlled phases: Submit (40s) → Vote (30s) → Award
- Image counter showing progress (IMAGE 01/14)
- Timer progress bar with colour transitions
- Top 3 voted captions earn bonus points

### Round 4: Shark Tank Pitch
- Live pitch presentations judged by panel
- Admin manually awards points

---

## 🛡️ Anti-Cheat Mechanism

```
Button States:
  AVAILABLE → click → IN PROGRESS (yellow, locked)
                          → round ends → COMPLETED (green, locked forever)

Stored in localStorage → survives page refresh
Game iframe blanked after completion → can't replay
```

---

## 🎛️ Admin Controls

| Control | Function |
|---|---|
| ⚡ Deploy + Unlock | One-click round activation |
| 🔒 Emergency Lock | Instantly freeze all players |
| 💉 Inject Points | Manual score override per team |
| 📋 Player Monitor | View all registered players & scores |
| 🎨 R3 Master Clock | Control caption submission & voting phases |

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/rishuvoid07/The-Ultimate-Quest.git

# Open in VS Code
cd The-Ultimate-Quest
code .

# Launch with Live Server (VS Code extension)
# Right-click index.html → "Open with Live Server"
```

> **Note:** Firebase is pre-configured. The app connects to Firestore automatically.

---

## 📁 Project Structure

```
The-Ultimate-Quest/
├── index.html              # Participant entry point
├── admin.html              # Admin control panel
├── css/
│   └── style.css           # Global styles + mobile responsive
├── js/
│   ├── auth.js             # Login, 3-member limit, squad display
│   ├── config.js           # Round/game configuration
│   ├── db.js               # Firebase Firestore operations
│   ├── main.js             # Game selector, anti-cheat, leaderboard
│   └── admin.js            # Admin panel logic
└── games/
    ├── round1/quiz.html    # Kahoot-style quiz
    ├── round2/hunt.html    # Scavenger hunt with progress
    ├── round3/
    │   ├── captions.html   # Witty captions game
    │   └── assets/         # 14 meme images
    └── round4/pitch.html   # Shark Tank pitch
```

---

## 👥 Team

- **Rishabh Jain** — Frontend Dev, Anti-Cheat System, Mobile Optimization
- **Aman Jha** — Project Lead, Core Architecture, Firebase Integration

---

## 📄 License

This project was built for a live college event at VIT Chennai. Feel free to fork and adapt for your own events!

---

<p align="center">
  <b>Built with ❤️ for The Ultimate Quest Event</b><br>
  <i>VIT Chennai • 2026</i>
</p>
