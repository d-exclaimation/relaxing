import { Redis } from "https://deno.land/x/upstash_redis@v1.22.0/mod.ts";

/**
 * Key-Value store client
 */
export const kv = new Redis({
  url: Deno.env.get("KV_URL") || "",
  token: Deno.env.get("KV_TOKEN") || "",
});
