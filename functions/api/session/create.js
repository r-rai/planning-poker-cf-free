import { isValidSessionName, isValidDeckType } from "../../../utils/validation.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

export async function onRequestPost(context) {
  try {
    const { DB } = context.env;
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

    const sessionName = (body.name || "Untitled Session").trim();
    const cardType = (body.cardType || "fibonacci").trim();

    // Input Validation
    if (!isValidSessionName(sessionName)) {
      return new Response(JSON.stringify({ error: "Invalid session name. Must be 1-50 alphanumeric characters or basic punctuation.", errorCode: "ERR_INVALID_SESSION_NAME" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!isValidDeckType(cardType)) {
      return new Response(JSON.stringify({ error: "Invalid card deck type.", errorCode: "ERR_INVALID_DECK_TYPE" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Generate a unique 6-character alphanumeric session ID
    let sessionId = "";
    const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789"; // Removed ambiguous chars like I, L, 1, 0, O
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 10) {
      sessionId = "";
      for (let i = 0; i < 6; i++) {
        sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if session ID already exists in DB
      const existing = await DB.prepare("SELECT id FROM sessions WHERE id = ?").bind(sessionId).first();
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return new Response(JSON.stringify({ error: "Failed to generate unique session ID. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const timestamp = Date.now();

    // Insert new session into DB
    await DB.prepare(
      "INSERT INTO sessions (id, name, card_type, current_story, revealed, created_at) VALUES (?, ?, ?, ?, 0, ?)"
    )
      .bind(sessionId, sessionName, cardType, "First Story", timestamp)
      .run();

    return new Response(JSON.stringify({ success: true, sessionId, sessionName, cardType }), {
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
