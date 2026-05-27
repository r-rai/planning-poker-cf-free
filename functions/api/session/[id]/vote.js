import { isValidVote } from "../../../../utils/validation.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";
// Submits or updates a participant's vote in a planning poker session.

export async function onRequestPost(context) {
  try {
    const { DB } = context.env;
    const sessionId = context.params.id;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database binding DB not found" }), {
        status: 500,
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

    const participantId = body.participantId;
    const vote = body.vote !== undefined ? body.vote : null; // Can be null to clear vote

    if (!participantId) {
      return new Response(JSON.stringify({ error: "participantId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Rate limiting
    const rlResponse = await rateLimiter(context.request);
    if (rlResponse) return rlResponse;

    // Fetch deck type for validation
    const sessionInfo = await DB.prepare("SELECT card_type FROM sessions WHERE id = ?").bind(sessionId).first();
    const deckType = sessionInfo ? sessionInfo.card_type : "fibonacci";

    // Validate vote
    if (!isValidVote(vote, deckType)) {
      return new Response(JSON.stringify({ error: 'Invalid vote value', errorCode: 'ERR_INVALID_VOTE' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const session = await DB.prepare("SELECT revealed FROM sessions WHERE id = ?").bind(sessionId).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (session.revealed === 1) {
      return new Response(JSON.stringify({ error: "Cannot vote. Votes are already revealed." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Update the vote
    const timestamp = Date.now();
    const result = await DB.prepare(
      "UPDATE participants SET vote = ?, last_seen = ? WHERE id = ? AND session_id = ?"
    )
      .bind(vote, timestamp, participantId, sessionId)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: "Participant not found in this session" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, participantId, vote }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

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
