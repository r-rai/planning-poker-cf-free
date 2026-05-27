import { rateLimiter } from "../../middleware/rateLimiter.js";

export async function onRequestGet(context) {
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

    // Parse query parameters
    const url = new URL(context.request.url);
    const participantId = url.searchParams.get("participantId");

    const now = Date.now();
    const staleThreshold = now - 90000; // 90 seconds threshold (resilient to browser background tab throttling)

    // 1. Perform heartbeat update if participantId is active in this session
    if (participantId) {
      await DB.prepare(
        "UPDATE participants SET last_seen = ? WHERE id = ? AND session_id = ?"
      )
        .bind(now, participantId, sessionId)
        .run();
    }

    // 2. Clear out stale participants for this session (haven't polled in 90s)
    await DB.prepare(
      "DELETE FROM participants WHERE session_id = ? AND last_seen < ?"
    )
      .bind(sessionId, staleThreshold)
      .run();

    // 3. Fetch session details
    const session = await DB.prepare("SELECT * FROM sessions WHERE id = ?").bind(sessionId).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Fetch active participants
    const participantsData = await DB.prepare(
      "SELECT id, display_name, role, vote, joined_at FROM participants WHERE session_id = ? ORDER BY joined_at ASC"
    )
      .bind(sessionId)
      .all();

    const participants = participantsData.results || [];

    // If there are no participants left in this session, should we clean up the session?
    // In a serverless environment, keeping the session record is fine, but we can let it linger.
    
    // Determine the host (oldest active participant)
    const hostId = participants.length > 0 ? participants[0].id : null;

    // 5. Mask other voters' card selections if the session is not revealed yet
    const isRevealed = session.revealed === 1;
    const formattedParticipants = participants.map(p => {
      const isSelf = p.id === participantId;
      const hasVoted = p.vote !== null && p.vote !== "";

      return {
        id: p.id,
        displayName: p.display_name,
        role: p.role,
        voted: hasVoted,
        // Return vote value ONLY if: 
        // a) session votes are revealed, OR 
        // b) the vote belongs to the requesting participant themselves
        vote: (isRevealed || isSelf) ? p.vote : null,
        isHost: p.id === hostId
      };
    });

    // 6. Fetch session history
    const historyData = await DB.prepare(
      "SELECT story_name, final_estimate, votes_json, created_at FROM stories_history WHERE session_id = ? ORDER BY created_at DESC"
    )
      .bind(sessionId)
      .all();

    const history = (historyData.results || []).map(h => ({
      storyName: h.story_name,
      finalEstimate: h.final_estimate,
      votes: JSON.parse(h.votes_json),
      createdAt: h.created_at
    }));

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        sessionName: session.name,
        cardType: session.card_type,
        currentStory: session.current_story,
        revealed: isRevealed,
        participants: formattedParticipants,
        hostId,
        isHost: participantId === hostId,
        history
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
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
