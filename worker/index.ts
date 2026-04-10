import { handleAuth } from './routes/auth';
import { handleContent } from './routes/content';
import { handleUser } from './routes/user';
import { handleAdmin } from './routes/admin';
import { handleAnalytics } from './routes/analytics';
import { LectureCommentsDO } from './durable/comments';

export { LectureCommentsDO };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
    const applyCors = (res: Response) => {
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
      return new Response(res.body, { status: res.status, headers });
    };

    if (request.method === 'OPTIONS') return applyCors(new Response(null, { status: 204 }));

    try {
      let response: Response;

      if (path.startsWith('/api/auth')) response = await handleAuth(request, env);
      else if (path.startsWith('/api/courses') || path.startsWith('/api/lectures') || path.startsWith('/api/resources') || path.startsWith('/api/search')) response = await handleContent(request, env);
      else if (path.startsWith('/api/bookmark') || path.startsWith('/api/progress') || path.startsWith('/api/notes') || path.startsWith('/api/rating') || path.startsWith('/api/comments')) response = await handleUser(request, env, ctx);
      else if (path.startsWith('/api/admin')) response = await handleAdmin(request, env, ctx);
      else if (path.startsWith('/api/analytics')) response = await handleAnalytics(request, env);
      else response = new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      return applyCors(response);
    } catch (error) {
      console.error('Worker Error:', error);
      return applyCors(new Response(JSON.stringify({ error: (error as Error).message || 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
    }
  }
} satisfies ExportedHandler<Env>;