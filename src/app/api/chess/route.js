import TrainingEngine from '@/lib/trainingEngine.js';

// POST /api/chess
// Body: { action, openingName, mode, sessionId?, move? }
// Returns: engine state or move result

const sessions = new Map(); // In-memory session store (use Redis/DB in prod)

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, openingName, mode, sessionId, move } = body;

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    if (action === 'init') {
      if (!openingName) {
        return Response.json({ error: 'Missing openingName' }, { status: 400 });
      }
      const engine = new TrainingEngine(openingName, mode || 'learn');
      const sid = `${Date.now()}-${Math.random()}`;
      sessions.set(sid, engine);

      return Response.json({
        sessionId: sid,
        openingName,
        mode,
        expectedMove: engine.getExpectedMove(),
        currentIndex: engine.currentIndex
      });
    }

    if (action === 'submitMove') {
      if (!sessionId || !move) {
        return Response.json({ error: 'Missing sessionId or move' }, { status: 400 });
      }

      const engine = sessions.get(sessionId);
      if (!engine) {
        return Response.json({ error: 'Session not found' }, { status: 404 });
      }

      const result = engine.submitMove(move);
      return Response.json({
        sessionId,
        ...result,
        currentIndex: engine.currentIndex,
        failed: engine.failed,
        expectedMove: engine.getExpectedMove()
      });
    }

    if (action === 'reset') {
      if (!sessionId) {
        return Response.json({ error: 'Missing sessionId' }, { status: 400 });
      }

      const engine = sessions.get(sessionId);
      if (!engine) {
        return Response.json({ error: 'Session not found' }, { status: 404 });
      }

      engine.reset();
      return Response.json({
        sessionId,
        status: 'reset',
        expectedMove: engine.getExpectedMove(),
        currentIndex: engine.currentIndex,
        failed: engine.failed
      });
    }

    if (action === 'getOpenings') {
      // Return list of available openings for the UI
      const openingsModule = await import('@/lib/openings.json', { assert: { type: 'json' } });
      const openingNames = Object.keys(openingsModule.default);
      return Response.json({ openings: openingNames });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Chess API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
