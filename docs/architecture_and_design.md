# 📐 Indic Futurism Planning Poker: Architectural & Design Guide

This guide details the system architecture, design decisions, and mathematical layouts governing the premium **Scrum Planning Poker** application.

---

## 🧭 System Architecture & Flow

The system is designed for the **Cloudflare Free Tier**, meaning it must run efficiently with zero server-side state (relying entirely on **Cloudflare D1 SQLite** for state persistence) and serve global clients at the Edge via **Cloudflare Pages Functions**.

### 🔗 Component Interaction Block

```mermaid
graph TD
    Client1[Voter Client A - Chrome] <-->|GET /api/session/:id <br> Heartbeat / Poll State| Edge[Cloudflare Pages Functions]
    Client2[Voter Client B - Edge] <-->|GET /api/session/:id <br> Heartbeat / Poll State| Edge
    Host[Host Client - Firefox] <-->|POST /api/session/:id/story <br> Configure Round / Timer| Edge
    
    Edge <-->|SQL Queries / Index Scans| D1[(Cloudflare D1 Database)]
    
    subgraph Cloudflare Global Edge Network
        Edge
        D1
    end
```

### 🔁 Sequence of a Voting Round

The diagram below details the sequence of a voting cycle from initialization, voting, automatic reveal countdown, to history archiving:

```mermaid
sequenceDiagram
    autonumber
    actor Host as Host (Voter)
    actor Voter as Voter (Active)
    participant Edge as Cloudflare Edge
    participant D1 as D1 SQLite DB
    
    Note over Host, Voter: Session "BYPVAU" active. Timer set to 60s.
    Voter->>Edge: POST /api/session/BYPVAU/vote (value: "5")
    Edge->>D1: UPDATE participants SET vote = '5' WHERE id = 'part_voter'
    D1-->>Edge: Row updated
    Edge-->>Voter: { success: true, vote: "5" }
    
    Note over Host: Polling engine detects all active voters have voted!
    loop Automated Auto-Reveal Countdown
        Host->>Edge: GET /api/session/BYPVAU
        Edge->>D1: SELECT * FROM participants WHERE session_id = 'BYPVAU'
        D1-->>Edge: Participant rows
        Edge-->>Host: All voted = true. Start client-side countdown!
    end
    
    Note over Host, Voter: Clients pulse "5, 4, 3, 2, 1..." in the center of the felt roundtable.
    
    Host->>Edge: POST /api/session/BYPVAU/reveal
    Edge->>D1: UPDATE sessions SET revealed = 1 WHERE id = 'BYPVAU'
    D1-->>Edge: Row updated
    Edge-->>Host: { success: true, revealed: true }
    
    Note over Host, Voter: 3D Flip estimate cards pivot to face-up!
    Host->>Edge: POST /api/session/BYPVAU/history (finalEstimate: "5")
    Edge->>D1: INSERT INTO stories_history (story_name, final_estimate, votes_json) ...
    D1-->>Edge: Row inserted
    Edge-->>Host: { success: true }
```

---

## 🎨 Design System: Indic Futurism

The design blends **heritage Indian motifs** with **sleek cyberpunk minimalism** across two adaptive, high-contrast visual modes.

```mermaid
graph LR
    System[Indic Futurism] --> Light[☀️ Ethereal Indic]
    System --> Dark[🌙 Neon Heritage]
    
    Light --> L_Bg[Warm Cream - #FDFBF7]
    Light --> L_Surf[Soft Sand - #F4EFE6]
    Light --> L_Acc[Terracotta - #C84B31]
    Light --> L_Geom[Curved Temple Arches]
    
    Dark --> D_Bg[Indigo Void - #08080C]
    Dark --> D_Surf[Midnight Indigo - #12131C]
    Dark --> D_Acc[Neon Saffron - #FF6B35]
    Dark --> D_Geom[Cyberpunk Sharp Contours]
```

### CSS Tokens & Style Application

*   **Custom Fonts:** Outfit (headings/accent numbers) and Inter (body content).
*   **Terracotta Accent Glows (Light Mode):**
    ```css
    box-shadow: 0 8px 30px rgba(200, 75, 49, 0.08);
    border-color: rgba(200, 75, 49, 0.2);
    ```
*   **Saffron Cyber Glows (Dark Mode):**
    ```css
    box-shadow: 0 0 15px rgba(255, 107, 53, 0.25);
    border-color: rgba(255, 107, 53, 0.4);
    ```
*   **Watermarks & Grids:** A repeating inline SVG background renders an elegant geometric diamond watermark in Light mode, turning into a cyber-saffron glowing grid pattern in Dark mode.

---

## 📐 Radial Roundtable Seating Mathematics

To replicate a physical Scrum poker table, participants are distributed mathematically around a central elliptical green felt canvas using custom polar coordinate formulas.

```text
               (Center Y - Radius Y)
                       |
(Center X - Radius X) -+- (Center X + Radius X)
                       |
               (Center Y + Radius Y)
```

### Mathematical Formulas

For a total count of $N$ participants, each participant $i$ (from $0$ to $N - 1$) is positioned at an angle:

$$\theta_i = \left(\frac{2\pi \cdot i}{N}\right) - \frac{\pi}{2}$$

The subtraction of $\frac{\pi}{2}$ rotates the coordinate system so the first participant is positioned directly at the **12 o'clock** position (top center), distributing clockwise thereafter.

The relative coordinate positions $(x_i, y_i)$ are mapped onto the elliptical felt canvas boundary as:

$$x_i = 50\% + R_x \cdot \cos(\theta_i)$$

$$y_i = 50\% + R_y \cdot \sin(\theta_i)$$

Where:
*   $R_x$ (Horizontal Radius) is set dynamically to **`38%`** (leaving padding for participant cards).
*   $R_y$ (Vertical Radius) is set dynamically to **`34%`** to match typical desktop viewport aspect ratios.

### Layout Implementation (JavaScript)
The calculation is updated inside the browser rendering pipeline:
```javascript
const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
const rx = 38; // percentage of half-width
const ry = 34; // percentage of half-height
const x = 50 + rx * Math.cos(angle);
const y = 50 + ry * Math.sin(angle);

seatElement.style.left = `${x}%`;
seatElement.style.top = `${y}%`;
```

---

## 🛡️ Throttling & Connection Resiliency

Modern desktop browsers implement aggressive resource throttling on inactive tabs:
1.  **Request Throttling:** `setInterval` or `requestAnimationFrame` timers may drop down to once per second, or occasionally freeze entirely.
2.  **Edge Disconnections:** If a player is inactive, server-side cron triggers might sweep their session thinking they crashed.

To prevent this without complex WebSockets setups (which exceed standard Cloudflare free bandwidth caps), the system integrates a dual-layer resiliency strategy:

### 1. Extended Server Sweeps
The D1 backend utilizes a generous **90-second timeout** window. If a client tab is throttled or suspended temporarily, their slot remains reserved:
$$\Delta t_{\text{stale}} = t_{\text{current}} - t_{\text{last\_seen}} > 90\,\text{seconds}$$

### 2. High-Fidelity Client Focus Wakeup
A listener monitors browser tab visibility. The split-second a voter re-focuses or opens a background tab containing their active session, the engine triggers an instant, un-throttled HTTP poll, immediately refreshing status:
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Force immediate REST API sync, bypassing standard interval timeouts
    syncStateImmediate();
  }
});
```

---

## ⚡ Cloudflare Free Tier Optimization Details

*   **D1 Storage Bounds:** D1 SQLite handles high-frequency index searches gracefully. To maintain low read/write units, active sweeps and heartbeats are compressed into a single query (`GET /api/session/[id]`).
*   **Payload Budgets:** Single Page App payload bundle size is kept under **100 KiB** by packing all styles (embedded Tailwind/vanilla definitions) and logic directly into a single cached `index.html` file, completely avoiding multi-megabyte frontend build runtimes.
