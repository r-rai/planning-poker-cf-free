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

## ☁️ Production Deployment & Maintenance Guide

Follow these clear, step-by-step instructions to push your code to GitHub, deploy the frontend and API edge functions to Cloudflare Pages, set up the D1 SQL database, and run automated database purging to keep the table size small.

---

### 1. 🐙 Push Your Project to GitHub

Before deploying to Cloudflare Pages, you need to push your local repository to a new repository on GitHub:

1. **Create a new repository** on [GitHub](https://github.com/new). Do **not** initialize it with a README, license, or `.gitignore` (as they are already present locally).
2. Copy the **HTTPS** or **SSH** URL of your new GitHub repository (e.g., `https://github.com/YOUR_USERNAME/planning-poker.git`).
3. Run the following commands in your local project terminal to connect and push your code:
   ```bash
   # Add your GitHub repository as the remote origin
   git remote add origin https://github.com/YOUR_USERNAME/planning-poker.git
   
   # Set the branch name to main
   git branch -M main
   
   # Push your code to GitHub
   git push -u origin main
   ```

---

### 2. 🗄️ Create and Initialize Cloudflare D1 Database

This application requires a Cloudflare D1 SQLite database to store sessions, votes, and story logs.

1. **Create the production D1 database** inside the Cloudflare Dashboard (**Workers & Pages** > **D1** > **Create Database**) or run the following command in your terminal:
   ```bash
   npx wrangler d1 create planning-poker-db
   ```
2. You **do not** need to copy or paste the `database_id` into your public `wrangler.toml` file! To protect your privacy in public repositories, the `wrangler.toml` in your repository remains entirely generic.
3. The remote scripts in `package.json` are pre-configured to target your database by its registered name (`planning-poker-db`) directly instead of the generic binding name (`DB`). Wrangler will securely authenticate against your Cloudflare account from your local terminal.
4. Run the remote migration to initialize the database tables in production:
   ```bash
   npm run db:init:remote
   ```

---

### 3. 🚀 Deploy to Cloudflare Pages via Dashboard

With your code on GitHub and your database initialized, you can deploy your application:

1. Go to the **Cloudflare Dashboard** and navigate to **Workers & Pages** > **Pages** > **Connect to Git** / **Create a project**.
2. Select your `planning-poker` GitHub repository.
3. In the **Set up builds and deployments** screen, configure the following settings:
   *   **Framework Preset:** `None`
   *   **Build Command:** `npm run build`
   *   **Build Output Directory:** `dist`
4. Click **Save and Deploy**.
5. Once the first build finishes, navigate to **Settings** > **Functions** > **D1 database bindings** in your Cloudflare Pages project.
6. Click **Add binding**:
   *   **Variable name (binding):** `DB`
   *   **D1 Database:** Select `planning-poker-db` from the dropdown list.
7. Go to the **Deployments** tab and click **Retry deployment** (or trigger a new git push) to apply the database binding.
8. **Congratulations!** Your application is now live on your custom `.pages.dev` subdomain!

---

### 4. 🧹 Database Maintenance (Purge Records Older Than 6 Hours)

To keep your D1 database clean and avoid exceeding free tier limits, a maintenance command has been added to purge database records (sessions, participants, and story history logs) that are older than 6 hours.

#### A. Manual Purging
To manually purge old database records, execute:
```bash
# Purge production database records
npm run db:purge

# Purge local simulated database records (during development)
npm run db:purge:local
```

#### B. Automated Purging via GitHub Actions
You can easily automate this cleanup using GitHub Actions to run the purge command every 6 hours:

1. Create a file called `.github/workflows/db-maintenance.yml` in your project.
2. Paste the following configuration into it:
   ```yaml
   name: DB Maintenance Purge

   on:
     schedule:
       # Runs every 6 hours
       - cron: '0 */6 * * *'
     workflow_dispatch: # Allows manual trigger from GitHub UI

   jobs:
     purge-db:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout Code
           uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: 18
             cache: 'npm'

         - name: Install Dependencies
           run: npm ci

         - name: Run Purge Command
           run: npm run db:purge
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```
3. Set your Cloudflare credentials as GitHub Secrets in your repository (**Settings** > **Secrets and variables** > **Actions**):
   *   `CLOUDFLARE_API_TOKEN`: A Cloudflare API token with `D1` edit permissions.
   *   `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
