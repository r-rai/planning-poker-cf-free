# 🔄 Project Resumption & Context Index

This document serves as an immutable bridge of context for the **Indic Futurism Planning Poker** project. When initiating a new session or pair-programming with an AI assistant, pointing to this file allows the agent to immediately inherit the full historical context, architectures, and state of the project.

---

## 🆔 Conversation & State Metadata
*   **Active Developer:** Ravi
*   **Finalized Conversation ID:** `f12dc623-6361-4f02-8ce9-b2e7b45f6aa0`
*   **State History Storage:** `/home/ravi/.gemini/antigravity-cli/brain/f12dc623-6361-4f02-8ce9-b2e7b45f6aa0/`
*   **Latest Release Tag:** `v1.3.0 (Dynamic Team Scaling & Layout Architecture Refactor)`

---

## 🗺️ Project State & Documentation Map

Refer to these files to immediately understand the current state of the application:

1.  **🚀 Deployment & Build:**
    *   [README.md](file:///home/ravi/projects/planning-poker/README.md): Contains the complete step-by-step production setup on Cloudflare Pages, GitHub origin linking, and manual database command guidelines.
    *   [package.json](file:///home/ravi/projects/planning-poker/package.json): Defines the clean bundler (`npm run build`), local wrangler server (`npm run dev`), remote migrations, and DB purge scripts.

2.  **🧹 Automated Database Maintenance:**
    *   [.github/workflows/db-maintenance.yml](file:///home/ravi/projects/planning-poker/.github/workflows/db-maintenance.yml): Configured GitHub Actions Cron Workflow executing a D1 SQLite sweep every 6 hours.

3.  **🏰 System Architecture & APIs:**
    *   [docs/architecture_and_design.md](file:///home/ravi/projects/planning-poker/docs/architecture_and_design.md): In-depth diagrams of the frontend-to-D1 loop, Polar math seating configurations, and Background Tab visibility listeners.
    *   [docs/database_schema.md](file:///home/ravi/projects/planning-poker/docs/database_schema.md): Complete D1 schema including indexing and cascade-delete referential integrity triggers.
    *   [docs/backend_api.md](file:///home/ravi/projects/planning-poker/docs/backend_api.md): REST API endpoints spec sheets and payload structures.

4.  **🎓 Full Development Chronicle:**
    *   [walkthrough.md](file:///home/ravi/.gemini/antigravity-cli/brain/239d391a-315b-4f14-9630-da7c978f2652/walkthrough.md): The chronological record of feature development (v1.0.0), security sweeps/CSP/Rate-Limiting (v1.1.0), and production preparations (v1.2.0).

---

## 🛠️ Current Status Checklist
- [x] **Premium UI/UX Design System:** Ethereal Indic (Light) and Neon Heritage (Dark) dual themes fully consistent and optimized.
- [x] **Client-Side Asset Separation:** Extracted inline styles and JS to cacheable `/static/app.css` and `/static/app.js`.
- [x] **Security Hardening:** Tight CSP headers (no `unsafe-inline`), secure input validations, and continuous refill Token-Bucket rate-limiting.
- [x] **Zero-Leak D1 Configuration:** Cleaned commands to execute by remote DB name rather than private IDs.
- [x] **Cron Maintenance:** Automated sweeps executing every 6 hours to prune sessions older than 6 hours.
- [x] **Dynamic Seating & Aspect Ratios:** Dynamic scaling of card sizes, spacing, and oval ratios to prevent overlaps on large teams ($N \ge 9$).
- [x] **Consolidated Sidebar & Transparent Card Deck:** Redesigned screen into a spacious 2-column layout (spacious Left roundtable arena, combined Observers/History Right sidebar) with invisible floating bottom cards tray.
- [x] **Collective Consensus Automatic Reveal:** Fully resilient automatic reveal that allows any estimator browser to safely call `/reveal` once all votes are locked, bypassing background tab suspensions.
- [x] **Wrangler Core Update:** Updated dev tools to the latest Wrangler CLI (`^4.95.0`).
