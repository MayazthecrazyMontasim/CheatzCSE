export class LectureCommentsDO extends DurableObject {
  storage: DurableObjectStorage;
  comments: Array<{ id: string; user: string; text: string; timestamp: number }>;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.storage = state.storage;
  }

  async fetch(request: Request) {
    if (!this.comments) {
      this.comments = await this.storage.get('comments') || [];
    }

    if (request.method === 'GET') {
      return new Response(JSON.stringify(this.comments), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (request.method === 'POST') {
      const body = await request.json();
      const comment = { id: crypto.randomUUID(), timestamp: Date.now(), ...body };
      this.comments.unshift(comment);
      await this.storage.put('comments', this.comments);
      return new Response(JSON.stringify(comment), { status: 201 });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }
}