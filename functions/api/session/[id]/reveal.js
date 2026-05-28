import { rateLimiter } from "../../middleware/rateLimiter.js";

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

    // Rate limiting
    const rlResponse = await rateLimiter(context.request);
    if (rlResponse) return rlResponse;

    // Parse requested parameters
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      body = {};
    }

    const participantId = body.participantId;

    if (!participantId) {
      return new Response(JSON.stringify({ error: "participantId is required", errorCode: "ERR_PARTICIPANT_ID_REQUIRED" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Authorize Host (must be the oldest active participant in the session)
    const hostCheck = await DB.prepare(
      "SELECT id FROM participants WHERE session_id = ? ORDER BY joined_at ASC"
    )
      .bind(sessionId)
      .first();

    const isHost = hostCheck && hostCheck.id === participantId;

    // Authorize if everyone has voted (collective consensus automatic reveal)
    const votersData = await DB.prepare(
      "SELECT vote FROM participants WHERE session_id = ? AND role = 'voter'"
    )
      .bind(sessionId)
      .all();
    const voters = votersData.results || [];
    const hasEveryoneVoted = voters.length > 0 && voters.every(v => v.vote !== null && v.vote !== "");

    if (!isHost && !hasEveryoneVoted) {
      return new Response(JSON.stringify({ error: "Unauthorized. Only the host can reveal votes before everyone has estimated.", errorCode: "ERR_UNAUTHORIZED_HOST_ONLY" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Update session state to revealed
    await DB.prepare("UPDATE sessions SET revealed = 1 WHERE id = ?").bind(sessionId).run();

    return new Response(JSON.stringify({ success: true, revealed: true }), {
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
