import { router } from "https://deno.land/x/rutt@0.1.0/mod.ts";
import { dashboard } from "./app/reviews/dash.ts";
import { members } from "./app/team/members.ts";
import "./lib/kv.ts";

Deno.serve(
  router({
    "/": () => Response.json({ ok: true }),
    "/dash": async (req) => {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      const data = await dashboard();
      if (!id) {
        return Response.json(data);
      }
      const dash = data.dash.find((d) => d.id === id);
      if (!dash)
        return Response.json(
          { info: `Profile not found for 'id' of '${id}'` },
          { status: 404 }
        );
      return Response.json({ dash, max: data.max });
    },
    "/profile": (req) => {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id)
        return Response.json(
          { info: `No 'id' query parameter provided` },
          { status: 400 }
        );
      const profile = members.find((m) => m.id === id);
      if (!profile)
        return Response.json(
          { info: `Profile not found for 'id' of '${id}'` },
          { status: 404 }
        );
      return Response.json(profile);
    },
  })
);
