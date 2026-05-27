import { isValidStoryName } from "../../../../utils/validation.js";
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
    const storyName = (body.storyName || "Untitled Story").trim();
    const finalEstimate = (body.finalEstimate || "Unestimated").toString().trim();
    const votesList = body.votes || []; // Expect Array of { displayName: 'Name', vote: 'Value' }

    if (!participantId) {
      return new Response(JSON.stringify({ error: "participantId is required", errorCode: "ERR_PARTICIPANT_ID_REQUIRED" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!isValidStoryName(storyName)) {
      return new Response(JSON.stringify({ error: "Invalid story name.", errorCode: "ERR_INVALID_STORY_NAME" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Validate finalEstimate format (alphanumeric, basic symbols, max 10 chars)
    const reEstimate = /^[A-Za-z0-9☕?. -]{1,10}$/;
    if (!reEstimate.test(finalEstimate)) {
      return new Response(JSON.stringify({ error: "Invalid final estimate format.", errorCode: "ERR_INVALID_ESTIMATE_FORMAT" }), {
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

    if (!hostCheck || hostCheck.id !== participantId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Only the host can add to history.", errorCode: "ERR_UNAUTHORIZED_HOST_ONLY" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const timestamp = Date.now();
    const votesJson = JSON.stringify(votesList);

    // Insert history record
    await DB.prepare(
      "INSERT INTO stories_history (session_id, story_name, final_estimate, votes_json, created_at) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(sessionId, storyName, finalEstimate, votesJson, timestamp)
      .run();

    return new Response(JSON.stringify({ success: true, storyName, finalEstimate }), {
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
