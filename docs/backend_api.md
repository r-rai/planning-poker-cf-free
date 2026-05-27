# 🔌 Edge API Endpoint Documentation

The application backend operates on **Cloudflare Pages Functions (Edge Workers)**, utilizing low-latency HTTP REST endpoints.

---

## 1. Create Session
Initializes a new Planning Poker estimation room.

*   **Endpoint:** `POST /api/session/create`
*   **Request Headers:** `Content-Type: application/json`
*   **Request Payload:**
    ```json
    {
      "name": "Sprint 42 Estimation",
      "cardType": "fibonacci" // Options: "fibonacci", "tshirt", "custom"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "sessionId": "BYPVAU",
      "sessionName": "Sprint 42 Estimation",
      "cardType": "fibonacci"
    }
    ```

---

## 2. Join Session
Registers a participant inside a room, or refreshes registration parameters.

*   **Endpoint:** `POST /api/session/[id]/join`
*   **Request Payload:**
    ```json
    {
      "displayName": "Ravi",
      "role": "voter", // Options: "voter", "spectator"
      "participantId": null // Send existing ID if reconnecting/refreshing
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "sessionId": "BYPVAU",
      "participantId": "part_gde7wnzcj3",
      "displayName": "Ravi",
      "role": "voter",
      "isHost": true // Older active participant automatically assigned host rights
    }
    ```

---

## 3. Fetch Session State (Heartbeat Poll)
Fetches the complete active room state. Updates the client's heartbeat, sweeps inactive players, masks other voters' estimates until revealed, and recalculates hosting slots.

*   **Endpoint:** `GET /api/session/[id]?participantId=part_gde7wnzcj3`
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "sessionId": "BYPVAU",
      "sessionName": "Sprint 42 Estimation",
      "cardType": "fibonacci",
      "currentStory": "First Story|1777263592000",
      "revealed": false,
      "participants": [
        {
          "id": "part_gde7wnzcj3",
          "displayName": "Ravi",
          "role": "voter",
          "voted": true,
          "vote": "8", // Unrevealed other votes are masked as null
          "isHost": true
        }
      ],
      "hostId": "part_gde7wnzcj3",
      "isHost": true,
      "history": []
    }
    ```

---

## 4. Cast Vote
Casts, alters, or clears a Scrum estimate card selection.

*   **Endpoint:** `POST /api/session/[id]/vote`
*   **Request Payload:**
    ```json
    {
      "participantId": "part_gde7wnzcj3",
      "vote": "5" // Use null to clear estimate
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "vote": "5"
    }
    ```

---

## 5. Reveal Estimates
Forces all cards in the room face-up (host only, or automated reveal loop).

*   **Endpoint:** `POST /api/session/[id]/reveal`
*   **Request Payload:**
    ```json
    {
      "participantId": "part_gde7wnzcj3"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "revealed": true
    }
    ```

---

## 6. Reset Round
Clears all votes and resets the revealed status to hide cards for the next estimation topic (host only).

*   **Endpoint:** `POST /api/session/[id]/reset`
*   **Request Payload:**
    ```json
    {
      "participantId": "part_gde7wnzcj3"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "revealed": false
    }
    ```

---

## 7. Update Story & Timer
Alters the active story name and attaches a countdown timer limit (host only).

*   **Endpoint:** `POST /api/session/[id]/story`
*   **Request Payload:**
    ```json
    {
      "participantId": "part_gde7wnzcj3",
      "storyName": "Implement zero-scroll layout",
      "timer": 60 // Options: 30, 60, or null
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "currentStory": "Implement zero-scroll layout|1777263592000"
    }
    ```

---

## 8. Log Estimated Story to History
Archived a completed story estimate, listing voters and raw estimates (host only).

*   **Endpoint:** `POST /api/session/[id]/history`
*   **Request Payload:**
    ```json
    {
      "participantId": "part_gde7wnzcj3",
      "storyName": "Implement zero-scroll layout",
      "finalEstimate": "8"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "historyCount": 1
    }
    ```

---

## 9. Leave Session
Gracefully removes a participant's seat from the room (used during logout).

*   **Endpoint:** `POST /api/session/[id]/leave`
*   **Request Payload:**
    ```json
    {
      "participantId": "part_gde7wnzcj3"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```
