// worker/durable/comments.ts
// Durable Object for per-lecture comment state
// No import/extends needed - Wrangler handles the binding

export class LectureCommentsDO {
  state: DurableObjectState;
  env: Env;
  comments: Array<{ id: string; user: string; text: string; timestamp: number }>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.comments = [];
  }

  async fetch(request: Request): Promise<Response> {
    // Load comments from storage on first access
    if (this.comments.length === 0) {
      const stored = await this.state.storage.get<Array<{ id: string; user: string; text: string; timestamp: number }>>('comments');
      if (stored) {
        this.comments = stored;
      }
    }

    const url = new URL(request.url);

    // GET: Return all comments for this lecture
    if (request.method === 'GET') {
      return new Response(JSON.stringify(this.comments), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST: Add a new comment
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const comment = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          user: body.user || 'Anonymous',
          text: body.text || ''
        };
        
        // Add to beginning of array (newest first)
        this.comments.unshift(comment);
        
        // Persist to durable storage
        await this.state.storage.put('comments', this.comments);
        
        return new Response(JSON.stringify(comment), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error processing comment:', error);
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}