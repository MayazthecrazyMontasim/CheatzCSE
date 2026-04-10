// worker/types.d.ts

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;

  // R2 Bucket
  BUCKET: R2Bucket;

  // Durable Objects
  COMMENTS_DO: DurableObjectNamespace;

  // Environment Variables
  SESSION_TTL: string;
  ADMIN_EMAIL?: string;
}

// Declare global types for Cloudflare Workers
declare global {
  interface ExportedHandler<TEnv = Env> {
    fetch?: (request: Request, env: TEnv, ctx: ExecutionContext) => Promise<Response>;
  }
}