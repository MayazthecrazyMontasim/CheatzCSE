import { searchLectures } from '../db/queries';

export async function handleContent(request: Request, env: Env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/courses') {
    const courses = await env.DB.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
    return new Response(JSON.stringify(courses.results));
  }

  if (url.pathname === '/api/lectures') {
    const courseId = url.searchParams.get('course_id');
    const query = courseId
      ? 'SELECT * FROM lectures WHERE course_id = ? ORDER BY week ASC'
      : 'SELECT * FROM lectures ORDER BY created_at DESC';
    const res = await env.DB.prepare(query).bind(courseId || '').all();
    return new Response(JSON.stringify(res.results));
  }

  if (url.pathname === '/api/resources') {
    const lectureId = url.searchParams.get('lecture_id');
    if (!lectureId) return new Response('Missing lecture_id', { status: 400 });
    const res = await env.DB.prepare('SELECT id, filename, mime_type, r2_path FROM resources WHERE lecture_id = ?').bind(lectureId).all();
    return new Response(JSON.stringify(res.results));
  }

  if (url.pathname === '/api/search') {
    const q = url.searchParams.get('q') || '';
    const results = await searchLectures(env.DB, q);
    return new Response(JSON.stringify(results.results));
  }

  return new Response('Not Found', { status: 404 });
}