# 🌟 Indic Futurism Planning Poker

A premium, high-performance global **Scrum Planning Poker** estimation web application designed for the **Cloudflare Free Tier** ecosystem. It utilizes Cloudflare Pages, Edge Functions, and a Cloudflare D1 SQL database to deliver zero-latency estimation sessions worldwide.

The user interface integrates Ravi's curated **Indic Futurism (Dual-Mode)** design system, featuring two custom aesthetic themes, a mathematical radial poker felt roundtable, and synchronized real-time countdown animations.

---

## 🎨 Design System: Indic Futurism

The application operates in two visually distinct modes, complete with custom typography, fluid transitions, and traditional heritage accents:

### ☀️ Ethereal Indic (Light Mode)
*   **Background:** Warm Cream (`#FDFBF7`) overlaid with a repeating diamond-based geometric SVG watermark.
*   **Surfaces:** Soft Sand (`#F4EFE6`) forming panels and card frames.
*   **Accents:** Deep Terracotta (`#C84B31`) forming active border contours, headers, and focus states.
*   **Geometries:** Tradition-infused arch shapes (fluid curved custom `border-radius` masks on card tops).
*   **Shadows:** Diffused warm terracotta shadows (`box-shadow: 0 8px 30px rgba(200, 75, 49, 0.08)`).

### 🌙 Neon Heritage (Dark Mode)
*   **Background:** Deep Indigo Void (`#08080C`) paired with a geometric cyber-saffron jali grid layout pattern.
*   **Surfaces:** Dark Midnight Indigo (`#12131C`).
*   **Accents:** Neon Saffron (`#FF6B35`) and Cyber Cyan (`#00F0FF`) glowing highlights.
*   **Geometries:** Sharp cyberpunk contours (4px corners and square frames).
*   **Shadows & Glows:** Saffron neon glows (`box-shadow: 0 0 15px rgba(255, 107, 53, 0.25)`).

---

## ✨ Features Checklist

*   **Radial Poker Roundtable:** Seat locations are mathematically distributed around a central green table felt using dynamic polar coordinates. Seats display voters' names, active roles, and micro-animated 3D flip estimate cards wrapped in a traditional geometric gold Jali backface.
*   **Synchronized Story Timer:** Hosts can assign optional 30-second, 60-second, or custom timers. The expiration timestamp is serialized inside the database using a schema-less structure (`Story Title|expiresAt`) and parsed in real time across all client browser viewports.
*   **Smart Automated Reveal:** When the last active voter casts their estimation, the host's polling engine automatically triggers a 5-second reveal sequence (`5, 4, 3, 2, 1` countdown) pulsing directly in the center of the felt table before flipping estimate cards face-up.
*   **Opaque, High-Contrast Seating:** Voter estimate slots are fully visible as styled template outlines (`waiting` state) and stand out with bold borders and background depths when votes are locked or revealed.
*   **Viewport-Bound Single Page Dashboard:** On desktop monitors, the interface hides the footer, locks scrollbars, and packs story details, the radial felt roundtable, and a flat horizontal voting cards tray completely inside the screen height.
*   **Robust Background Tab Resilience:** Heartbeat sweep triggers are set to a relaxed **90 seconds** on the D1 backend to survive background browser tab throttling. A global `visibilitychange` listener immediately forces a polling update the split-second a throttled tab is focused.
*   **Active Observers Stream:** Supports spectators who can join to monitor voting, consensus, and history. The voting card tray is automatically hidden and viewport heights are dynamically adjusted for a dedicated observer layout.
*   **Estimation History & Export:** Keeps a scrolling log of completed story points. Detailed voting breakdowns can be downloaded instantly as a clean CSV table.

---

## 📁 Project Structure

```text
planning-poker/
├── .wrangler/                  # Local Wrangler D1 DB simulated state
├── docs/                       # Comprehensive architectural documentation
│   ├── database_schema.md      # D1 SQLite schema details
│   └── backend_api.md          # Cloudflare Pages Functions REST endpoints
├── functions/
│   └── api/
│       └── session/
│           ├── [id]/
│           │   ├── history.js  # POST: Add estimated story to log
│           │   ├── index.js    # GET: Get complete room state & heartbeats
│           │   ├── join.js     # POST: Create or re-join session slot
│           │   ├── leave.js    # POST: Gracefully clear participant row
│           │   ├── reset.js    # POST: Reset round state for next story
│           │   ├── reveal.js   # POST: Force flip all cards face-up
│           │   ├── story.js    # POST: Update story title & timer
│           │   └── vote.js     # POST: Cast or clear Scrum estimate card
│           └── create.js       # POST: Initialize new session room
├── d1-schema.sql               # SQLite Schema structure definitions
├── index.html                  # Single-page frontend application & script engine
├── package.json                # Project configurations & dev dependencies
└── wrangler.toml               # Wrangler development & bindings profile
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your computer.

### 2. Install Dependencies
Clone this repository to your projects directory and install:
```bash
npm install
```

### 3. Initialize the Simulated D1 Database
Create the local simulated D1 SQLite tables using Wrangler:
```bash
npm run db:init
```

### 4. Run the Development Server
Launch the simulated Miniflare Wrangler pages server:
```bash
npm run dev
```
The server will boot up locally at **`http://localhost:8788`**. You can open multiple incognito windows or invite team members on your local network to test the real-time estimation dashboard!

---

## ☁️ Cloudflare Pages Production Deployment

### 1. Create a D1 Database in Cloudflare
Register a new D1 database instance in your Cloudflare dashboard, or execute via terminal:
```bash
npx wrangler d1 create planning-poker-db
```
Cloudflare will return database binding parameters (database name and `database_id`). Paste these inside your root [wrangler.toml](file:///home/ravi/projects/planning-poker/wrangler.toml) profile under:
```toml
[[d1_databases]]
binding = "DB"
database_name = "planning-poker-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 2. Deploy Schema to Remote D1 Database
Initialize your production remote database tables:
```bash
npm run db:init:remote
```

### 3. Push and Host on Cloudflare Pages
Connect your repository to your Cloudflare Pages dashboard, select **Pages** deployment, bind your D1 Database under the Pages environment settings tab as `DB`, and deploy! Your Scrum application will go live globally across Cloudflare's free edge CDN!
