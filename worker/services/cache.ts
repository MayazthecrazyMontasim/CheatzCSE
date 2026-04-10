export async function incrementView(env: Env, lectureId: string) {
  const key = `view:${lectureId}`;
  const current = Number(await env.CACHE.get(key)) || 0;
  await env.CACHE.put(key, String(current + 1), { expirationTtl: 604800 });
}

export async function addToRecent(env: Env, lectureId: string) {
  const key = 'recent:ids';
  let list: string[] = [];
  try { list = JSON.parse(await env.CACHE.get(key) || '[]'); } catch {}
  
  list = [lectureId, ...list.filter(id => id !== lectureId)].slice(0, 20);
  await env.CACHE.put(key, JSON.stringify(list), { expirationTtl: 604800 });
}

export async function getPopular(env: Env) {
  const keys = await env.CACHE.list({ prefix: 'view:' });
  const sorted = keys.keys
    .map(k => ({ id: k.name.replace('view:', ''), views: Number(k.value) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  return sorted;
}