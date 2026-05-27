# Simple PRD — Planning Poker for Scrum

## Product Overview

A lightweight Planning Poker application for Scrum teams.

The application allows users to:
- Create a planning session
- Share a session link
- Join instantly without login
- Vote anonymously using Planning Poker cards
- Reveal votes together
- Discuss and re-vote if needed

The product is intentionally minimal and designed to run entirely on Cloudflare free-tier services.

---

# Goals

## Primary Goals
- Extremely simple user experience
- No signup or login required
- Fast real-time collaboration
- Free or near-zero hosting cost
- Mobile-friendly
- Easy deployment

## Non Goals
- User management
- Enterprise authentication
- Complex project management
- Sprint tracking
- Advanced analytics
- AI estimation

---

# Target Users

## Users
- Scrum teams
- Developers
- QA engineers
- Product owners
- Scrum masters
- Small engineering teams

---

# Core Features

## 1. Create Session

A user can:
- Create a new Planning Poker session
- Enter a session name
- Select card type:
  - Fibonacci
  - T-shirt sizing
  - Custom

### Output
- Unique session URL
- Shareable join code

Example:
`https://planningpoker.app/session/ABCD123`

---

## 2. Join Session

Users can:
- Open shared session URL
- Enter display name
- Join instantly

### No Authentication
- No email
- No password
- No signup

---

## 3. Story Management

Host can:
- Add story title
- Edit story title
- Move to next story
- Remove story

### Example Story
- User Login API
- Payment Integration
- Dashboard UI

---

## 4. Voting

Participants can:
- Select estimate card
- Change vote before reveal
- See who has voted
- Keep votes hidden until reveal

### Voting Workflow
1. Story displayed
2. Users vote privately
3. Host clicks Reveal
4. All votes shown together
5. Team discusses
6. Optional re-vote
7. Final estimate accepted

---

## 5. Session Controls

Host can:
- Reveal votes
- Reset voting
- Change active story
- End session

---

# Technical Requirements

## Frontend
### Technology
- React
- TypeScript
- Tailwind CSS
- Vite

### Hosting
- Cloudflare Pages

---

## Backend

### Technology Options
Preferred:
- Cloudflare Workers
- Durable Objects for real-time session state

Alternative:
- Firebase Realtime Database

---

## Real-Time Communication

### Recommended
- Cloudflare Durable Objects WebSocket support

### Requirements
- Real-time vote updates
- Real-time participant updates
- Reveal synchronization

---

# Session Data Model

## Session
| Field | Type |
|---|---|
| sessionId | string |
| sessionName | string |
| createdAt | timestamp |
| currentStory | string |
| revealed | boolean |

## Participant
| Field | Type |
|---|---|
| participantId | string |
| displayName | string |
| joinedAt | timestamp |

## Vote
| Field | Type |
|---|---|
| participantId | string |
| value | string |
| voted | boolean |

---

# User Experience

## Design Goals
- Join within 5 seconds
- One-click voting
- Minimal UI clutter
- Mobile responsive
- Dark mode friendly

---

# Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Users can create sessions |
| FR-2 | Users can join via shared link |
| FR-3 | No authentication required |
| FR-4 | Votes remain hidden until reveal |
| FR-5 | Host can reset votes |
| FR-6 | Session updates are real time |
| FR-7 | Multiple users can vote simultaneously |
| FR-8 | Mobile browsers are supported |

---

# Non Functional Requirements

| Requirement | Target |
|---|---|
| Initial load time | < 2 seconds |
| Vote sync latency | < 500ms |
| Concurrent users/session | 50 |
| Hosting cost | Free tier |

---

# Architecture

## High Level Architecture

Browser Client
↓
Cloudflare Pages (Frontend)
↓
Cloudflare Workers API
↓
Durable Objects (Session State)

---

# Deployment

## Hosting Stack
| Component | Service |
|---|---|
| Frontend | Cloudflare Pages |
| Backend API | Cloudflare Workers |
| Real-time State | Durable Objects |
| CDN | Cloudflare |

---

# MVP Scope

## Included
- Create session
- Join session
- Anonymous voting
- Reveal votes
- Reset votes
- Fibonacci cards
- Real-time updates
- Mobile support
- Spectator mode
- Vote history
- Export session data to CSV/Excel

## Excluded
- Login
- Database persistence
- Jira integration
- Analytics
- Chat
- Video/audio

---

# Additional Features

## Spectator Mode

Users can join sessions as spectators.

### Spectator Capabilities
- View active story
- View participants
- View revealed votes
- View session progress

### Restrictions
- Cannot vote
- Cannot control session

### Use Cases
- Managers observing sprint planning
- Product owners reviewing estimates
- Training/demo sessions

---

## Vote History

The application stores vote history for the active session.

### Stored Information
- Story name
- Final estimate
- Individual votes
- Voting rounds
- Timestamp

### Benefits
- Sprint planning audit trail
- Estimation review discussions
- Team calibration analysis

---

## Export Functionality

Users can export session data.

### Supported Formats
- CSV
- Excel (.xlsx)

### Exported Fields
| Field |
|---|
| Story Name |
| Final Estimate |
| Individual Votes |
| Voting Round |
| Timestamp |
| Participants |

### Example Use Cases
- Sprint planning documentation
- Agile reporting
- Retrospective analysis
- Sharing with stakeholders

---

# Future Enhancements

## Phase 2
- Jira integration
- Story import
- Session persistence
- Public session templates
- Team branding/customization

## Phase 3
- AI estimation suggestions
- Slack integration
- Teams integration
- Public templates

---

# Risks

| Risk | Mitigation |
|---|---|
| Durable Object connection limits | Optimize WebSocket handling |
| Session state loss | Optional persistence layer later |
| Abuse/spam sessions | Rate limiting |

---

# Success Metrics

| Metric | Target |
|---|---|
| Time to join session | < 5 sec |
| Average voting round | < 1 min |
| Hosting cost | Free tier |
| Mobile usability | 100% responsive |

---

# Conclusion

The product focuses on one thing only:

Helping Scrum teams quickly estimate stories together with zero friction.

By removing authentication, heavy project management features, and enterprise complexity, the application stays lightweight, fast, and inexpensive to operate using Cloudflare free-tier infrastructure.

