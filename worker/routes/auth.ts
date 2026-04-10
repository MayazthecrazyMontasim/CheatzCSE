import { getSession } from '../middleware/auth';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleAuth(request: Request, env: Env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    const { email, password } = await request.json();
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409 });

    const hash = await hashPassword(password);
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').bind(id, email, hash).run();
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const { email, password } = await request.json();
    const hash = await hashPassword(password);
    const user = await env.DB.prepare('SELECT id, role FROM users WHERE email = ? AND password_hash = ?').bind(email, hash).first();
    if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

    const sessionId = crypto.randomUUID();
    await env.SESSIONS.put(sessionId, user.id, { expirationTtl: Number(env.SESSION_TTL) });
    const res = new Response(JSON.stringify({ ok: true, role: user.role }));
    res.headers.set('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${env.SESSION_TTL}`);
    return res;
  }

  if (url.pathname === '/api/auth/me') {
    const userId = await getSession(request, env);
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthenticated' }), { status: 401 });
    const user = await env.DB.prepare('SELECT id, email, role FROM users WHERE id = ?').bind(userId).first();
    return new Response(JSON.stringify(user));
  }

  return new Response('Not Found', { status: 404 });
}