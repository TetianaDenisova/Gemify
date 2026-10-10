import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({ error: "Sign in required" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return reply({ error: "Invalid session" }, 401);
  try {
    const body = await request.json();
    if (body?.confirmation !== "DELETE") return reply({ error: "Confirmation required" }, 400);

    // Derive the storage prefix from verified identity, never request parameters.
    const bucket = admin.storage.from("gemify-photos");
    const folders = [user.id];
    while (folders.length) {
      const folder = folders.pop()!;
      let offset = 0;
      const files: string[] = [];
      while (true) {
        const { data: objects, error } = await bucket.list(folder, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        for (const object of objects ?? []) {
          const path = `${folder}/${object.name}`;
          if (object.id) files.push(path);
          else folders.push(path);
        }
        if ((objects?.length ?? 0) < 1000) break;
        offset += 1000;
      }
      for (let index = 0; index < files.length; index += 1000) {
        const { error } = await bucket.remove(files.slice(index, index + 1000));
        if (error) throw error;
      }
    }
    // sync_rows is removed by its auth.users ON DELETE CASCADE relationship.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return reply({ deleted: true });
  } catch {
    return reply({ error: "Account deletion failed. Please retry." }, 500);
  }
});
