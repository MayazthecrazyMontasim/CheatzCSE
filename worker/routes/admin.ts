// worker/routes/admin.ts
import { requireAdmin } from '../middleware/auth';

export async function handleAdmin(request: Request, env: Env, ctx: ExecutionContext) {
  await requireAdmin(request, env);
  const url = new URL(request.url);

  if (request.method === 'POST') {
    // ─────────────────────────────────────────────────────────────
    // PDF/Resource Upload (requires R2)
    // ─────────────────────────────────────────────────────────────
    if (url.pathname === '/api/admin/upload') {
      // Guard: R2 must be configured
      if (!env.BUCKET) {
        return new Response(
          JSON.stringify({ 
            error: 'R2 storage not configured. Please enable R2 in your Cloudflare account and redeploy.' 
          }), 
          { status: 501, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;
      const lectureId = formData.get('lecture_id') as string;
      
      if (!file || !lectureId) {
        return new Response(JSON.stringify({ error: 'Missing file or lecture_id' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        // Generate unique key for R2
        const key = `resources/${crypto.randomUUID()}-${file.name}`;
        
        // Upload to R2 with proper metadata
        await env.BUCKET.put(key, file.stream(), { 
          httpMetadata: { 
            contentType: file.type,
            contentDisposition: `attachment; filename="${file.name}"`
          },
          customMetadata: {
            uploadedBy: 'admin',
            lectureId
          }
        });
        
        // Save metadata to D1
        await env.DB.prepare(
          'INSERT INTO resources (id, lecture_id, r2_path, filename, mime_type) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), lectureId, key, file.name, file.type).run();
        
        return new Response(JSON.stringify({ 
          ok: true, 
          path: key, 
          filename: file.name,
          // Optional: return public URL if bucket is public
          // url: `https://pub-${env.BUCKET.bucketName}.r2.dev/${key}`
        }), { headers: { 'Content-Type': 'application/json' } });
        
      } catch (error) {
        console.error('R2 upload error:', error);
        return new Response(JSON.stringify({ error: 'Failed to upload file' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // JSON-based admin actions (no R2 required)
    // ─────────────────────────────────────────────────────────────
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/admin/course') {
      if (!body.semester_id || !body.title) {
        return new Response(JSON.stringify({ error: 'Missing semester_id or title' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await env.DB.prepare(
        'INSERT INTO courses (id, semester_id, title, description) VALUES (?, ?, ?, ?)'
      ).bind(body.id || crypto.randomUUID(), body.semester_id, body.title, body.description || '').run();
      
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (url.pathname === '/api/admin/lecture') {
      if (!body.course_id || !body.youtube_id || !body.week || !body.topic) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: course_id, youtube_id, week, topic' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await env.DB.prepare(
        'INSERT INTO lectures (id, course_id, youtube_id, week, topic) VALUES (?, ?, ?, ?, ?)'
      ).bind(body.id || crypto.randomUUID(), body.course_id, body.youtube_id, body.week, body.topic).run();
      
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (url.pathname === '/api/admin/announcement') {
      if (!body.title || !body.content) {
        return new Response(JSON.stringify({ error: 'Missing title or content' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await env.DB.prepare(
        'INSERT INTO announcements (id, title, content) VALUES (?, ?, ?)'
      ).bind(crypto.randomUUID(), body.title, body.content).run();
      
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GET endpoints
  // ─────────────────────────────────────────────────────────────
  if (request.method === 'GET') {
    if (url.pathname === '/api/admin/announcements') {
      const res = await env.DB.prepare(
        'SELECT id, title, content, posted_at FROM announcements ORDER BY posted_at DESC LIMIT 50'
      ).all();
      return new Response(JSON.stringify(res.results), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (url.pathname === '/api/admin/courses') {
      const res = await env.DB.prepare(
        'SELECT c.*, s.name as semester_name FROM courses c LEFT JOIN semesters s ON c.semester_id = s.id ORDER BY c.created_at DESC'
      ).all();
      return new Response(JSON.stringify(res.results), { headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}