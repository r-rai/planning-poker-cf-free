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

    // Delete participant
    await DB.prepare("DELETE FROM participants WHERE id = ? AND session_id = ?")
      .bind(participantId, sessionId)
      .run();

    return new Response(JSON.stringify({ success: true, participantId }), {
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
