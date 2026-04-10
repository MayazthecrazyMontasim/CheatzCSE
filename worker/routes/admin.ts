import { requireAdmin } from '../middleware/auth';

export async function handleAdmin(request: Request, env: Env, ctx: ExecutionContext) {
  await requireAdmin(request, env);
  const url = new URL(request.url);

  if (request.method === 'POST') {
    if (url.pathname === '/api/admin/upload') {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const lectureId = formData.get('lecture_id') as string;
      if (!file || !lectureId) return new Response('Missing file or lecture_id', { status: 400 });

      const key = `resources/${crypto.randomUUID()}-${file.name}`;
      await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      await env.DB.prepare('INSERT INTO resources (id, lecture_id, r2_path, filename, mime_type) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), lectureId, key, file.name, file.type).run();
      return new Response(JSON.stringify({ path: key, filename: file.name }));
    }

    const body = await request.json();
    if (url.pathname === '/api/admin/course') {
      await env.DB.prepare('INSERT INTO courses (id, semester_id, title, description) VALUES (?, ?, ?, ?)').bind(body.id || crypto.randomUUID(), body.semester_id, body.title, body.description).run();
      return new Response(JSON.stringify({ ok: true }));
    }
    if (url.pathname === '/api/admin/lecture') {
      await env.DB.prepare('INSERT INTO lectures (id, course_id, youtube_id, week, topic) VALUES (?, ?, ?, ?, ?)').bind(body.id || crypto.randomUUID(), body.course_id, body.youtube_id, body.week, body.topic).run();
      return new Response(JSON.stringify({ ok: true }));
    }
    if (url.pathname === '/api/admin/announcement') {
      await env.DB.prepare('INSERT INTO announcements (id, title, content) VALUES (?, ?, ?)').bind(crypto.randomUUID(), body.title, body.content).run();
      return new Response(JSON.stringify({ ok: true }));
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/announcements') {
    const res = await env.DB.prepare('SELECT * FROM announcements ORDER BY posted_at DESC').all();
    return new Response(JSON.stringify(res.results));
  }

  return new Response('Not Found', { status: 404 });
}