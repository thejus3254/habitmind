# HabitMind 🌌

**HabitMind** is a premium, glassmorphism-styled habit tracking web application designed to help users build consistent routines, visualize patterns, and stay motivated. It combines a sleek dark-themed UI with powerful **Groq Cloud AI integrations** and a robust **Supabase database** backend.

---

**Live demo → [habitmind-xi.vercel.app](https://habitmind-xi.vercel.app/)**

## ✨ Features

*   **Premium Glassmorphic UI**: Vibrant, responsive dark-mode layout styled with curated color palettes, elegant gradients, Outfit typography, and custom micro-animations.
*   **Time Travel Mode**: Inspect, toggle, and manage your habits on any historical date. A specialized top warning banner alerts you of time-travel states with a quick click to reset.
*   **Audio & Browser Alerts**: Synthesized sound alerts using standard `AudioContext` frequencies accompanied by HTML5 push notifications for upcoming habits.
*   **Habit Heatmaps (Dot Grid)**: Interactive 28-day Github-style contribution grid visualizations on each habit card.
*   **Monthly Calendar & Analytics**: Complete calendar grids and analytical summaries showing overall completion rates.
*   **🧠 Groq-Powered AI Features (Llama-3.3-70b-versatile)**:
    *   *AI Difficulty Rater*: Auto-analyzes the name of your proposed habit to tag its complexity on creation.
    *   *Daily Personal Coach*: Scans streaks and today's completions to draft structured, supportive advice.
    *   *Weekly Insights*: Delivers overall assessments, identifying strongest habits, caution areas, and concrete actionable suggestions.
    *   *AI Recommendations*: Recommends complementary habits matching your tracking lists.
    *   *AI Coach Chatbot*: Supportive conversational chatbot to troubleshoot routines and schedule conflicts.

---

## 🛠️ Architecture & Tech Stack

```
                                +-----------------------------+
                                |  Vue 3 / Vite (Frontend)    |
                                +--------------+--------------+
                                               |
                                            HTTP API
                                               |
                                               v
                                +-----------------------------+
                                |    Express (Backend)        |
                                +-------+--------------+------+
                                        |              |
                                    SQL Queries    SDK Requests
                                        |              |
                                        v              v
                              +------------------+   +--------------------+
                              |  Supabase DB     |   |  Groq SDK (Llama)  |
                              +------------------+   +--------------------+
```

### Technology Breakdown
*   **Frontend**: Vue 3 (Composition API `<script setup>`), Vite, Axios, HSL CSS Custom Tokens, AudioContext.
*   **Backend**: Node.js, Express, CORS, Dotenv, Supabase JS Client, Groq SDK.
*   **Services**: Supabase Database, Groq Cloud API.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   NPM or Yarn
*   A Supabase Project
*   A Groq API Key

### Backend Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add the following keys:
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```
4. Run the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## 📂 Project Structure

```
habitmind/
├── backend/
│   ├── routes/
│   │   ├── habits.js       # CRUD operations, streaks, history
│   │   └── ai.js           # Groq AI integrations
│   ├── check_schema.js     # DB schema checking utility
│   ├── index.js            # Express entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (DotGrid, WeeklyInsight, HabitCard, etc.)
│   │   ├── App.vue         # Main entry point & global state
│   │   ├── main.js
│   │   └── style.css       # Core design system stylesheet
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

Built by [Thejus](https://github.com/thejusdev)
