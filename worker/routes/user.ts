import { getSession } from '../middleware/auth';
import { incrementView, addToRecent } from '../services/cache';

export async function handleUser(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);

  // Track view
  if (url.pathname.startsWith('/api/lectures/view/')) {
    const lectureId = url.pathname.split('/').pop()!;
    ctx.waitUntil(incrementView(env, lectureId));
    ctx.waitUntil(addToRecent(env, lectureId));
    return new Response(JSON.stringify({ ok: true }));
  }

  // Route comments to Durable Object
  if (url.pathname.startsWith('/api/comments/')) {
    const lectureId = url.pathname.split('/').pop()!;
    const id = env.COMMENTS_DO.idFromName(lectureId);
    return env.COMMENTS_DO.get(id).fetch(request);
  }

  // Auth required for personal actions
  const userId = await getSession(request, env);
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  if (request.method === 'POST') {
    if (url.pathname === '/api/bookmark') {
      const { lecture_id } = await request.json();
      await env.DB.prepare('INSERT OR IGNORE INTO bookmarks (user_id, lecture_id) VALUES (?, ?)').bind(userId, lecture_id).run();
    } else if (url.pathname === '/api/progress') {
      const { lecture_id, status } = await request.json();
      await env.DB.prepare('INSERT OR REPLACE INTO progress (user_id, lecture_id, status, completed_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').bind(userId, lecture_id, status).run();
    } else if (url.pathname === '/api/notes') {
      const { lecture_id, content } = await request.json();
      await env.DB.prepare('INSERT INTO notes (id, user_id, lecture_id, content) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), userId, lecture_id, content).run();
    } else if (url.pathname === '/api/rating') {
      const { lecture_id, score } = await request.json();
      await env.DB.prepare('INSERT OR REPLACE INTO ratings (user_id, lecture_id, score) VALUES (?, ?, ?)').bind(userId, lecture_id, score).run();
    }
    return new Response(JSON.stringify({ ok: true }));
  }

  if (request.method === 'GET') {
    if (url.pathname === '/api/bookmarks') {
      const res = await env.DB.prepare('SELECT b.*, l.topic FROM bookmarks b JOIN lectures l ON b.lecture_id = l.id WHERE b.user_id = ?').bind(userId).all();
      return new Response(JSON.stringify(res.results));
    }
    if (url.pathname === '/api/progress') {
      const res = await env.DB.prepare('SELECT p.*, l.topic FROM progress p JOIN lectures l ON p.lecture_id = l.id WHERE p.user_id = ?').bind(userId).all();
      return new Response(JSON.stringify(res.results));
    }
    if (url.pathname === '/api/notes') {
      const res = await env.DB.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
      return new Response(JSON.stringify(res.results));
    }
  }

  return new Response('Not Found', { status: 404 });
}