import { getPopular } from '../services/cache';

export async function handleAnalytics(request: Request, env: Env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/analytics/popular') {
    const popular = await getPopular(env);
    if (!popular.length) return new Response('[]');
    const ids = popular.map(p => `'${p.id}'`).join(',');
    const lectures = await env.DB.prepare(`SELECT * FROM lectures WHERE id IN (${ids})`).all();
    return new Response(JSON.stringify(lectures.results));
  }

  if (url.pathname === '/api/analytics/recent') {
    const recentJson = await env.CACHE.get('recent:ids');
    const ids = recentJson ? JSON.parse(recentJson) : [];
    if (!ids.length) return new Response('[]');
    const idStr = ids.map((id: string) => `'${id}'`).join(',');
    const lectures = await env.DB.prepare(`SELECT * FROM lectures WHERE id IN (${idStr})`).all();
    return new Response(JSON.stringify(lectures.results));
  }

  return new Response('Not Found', { status: 404 });
}