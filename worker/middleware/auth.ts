export async function getSession(request: Request, env: Env): Promise<string | null> {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match?.[1]) return null;
  
  const userId = await env.SESSIONS.get(match[1]);
  return userId || null;
}

export async function requireAuth(request: Request, env: Env): Promise<string> {
  const userId = await getSession(request, env);
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export async function requireAdmin(request: Request, env: Env): Promise<string> {
  const userId = await requireAuth(request, env);
  const user = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
  if (!user || user.role !== 'admin') throw new Error('Forbidden');
  return userId;
}