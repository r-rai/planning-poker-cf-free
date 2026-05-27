// POST /api/session/[id]/join
// Joins an existing planning poker session

import { isValidName, isValidRole } from "../../../../utils/validation.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";

export async function onRequestPost(context) {
  try {
    const { DB } = context.env;
    const sessionId = context.params.id; // Extract from [id]

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database binding DB not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Rate limiting
    const rlResponse = await rateLimiter(context.request);
    if (rlResponse) return rlResponse;

    const session = await DB.prepare("SELECT id FROM sessions WHERE id = ?").bind(sessionId).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Parse requested parameters
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      body = {};
    }

    const displayName = (body.displayName || "Anonymous").trim().substring(0, 30);
    const role = body.role === "spectator" ? "spectator" : "voter";

    // Validate displayName and role
    if (!isValidName(displayName)) {
      return new Response(JSON.stringify({ error: 'Invalid display name', errorCode: 'ERR_INVALID_NAME' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (!isValidRole(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role', errorCode: 'ERR_INVALID_ROLE' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check if participant is reconnecting (with existing participantId)
    let participantId = body.participantId;
    let isRejoin = false;

    if (participantId) {
      const existing = await DB.prepare("SELECT id FROM participants WHERE id = ? AND session_id = ?")
        .bind(participantId, sessionId)
        .first();
      
      if (existing) {
        isRejoin = true;
      }
    }

    const timestamp = Date.now();

    if (isRejoin) {
      // Reconnection: update last seen time and name/role if they changed
      await DB.prepare(
        "UPDATE participants SET display_name = ?, role = ?, last_seen = ? WHERE id = ? AND session_id = ?"
      )
        .bind(displayName, role, timestamp, participantId, sessionId)
        .run();
    } else {
      // New joiner: generate standard unique participantId
      participantId = "part_" + Math.random().toString(36).substring(2, 15);
      await DB.prepare(
        "INSERT INTO participants (id, session_id, display_name, role, vote, joined_at, last_seen) VALUES (?, ?, ?, ?, NULL, ?, ?)"
      )
        .bind(participantId, sessionId, displayName, role, timestamp, timestamp)
        .run();
    }

    // Get the list of all participants to determine if this person is the host.
    // The participant with the oldest joined_at is the host.
    const allParticipants = await DB.prepare(
      "SELECT id FROM participants WHERE session_id = ? ORDER BY joined_at ASC"
    )
      .bind(sessionId)
      .all();

    const isHost = allParticipants.results.length > 0 && allParticipants.results[0].id === participantId;

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        participantId,
        displayName,
        role,
        isHost
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// OPTIONS preflight response for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
