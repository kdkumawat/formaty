import type { Env } from "./types/env";
import { json, error } from "./utils/response";
import { handlePostPlayground, handleGetPlayground, handlePutPlayground, handleDeletePlayground } from "./routes/playground";
import {
  handlePostFeedback,
  handleListFeedback,
  handleUpdateFeedback,
  handleDeleteFeedback,
} from "./routes/feedback";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      if (url.pathname === "/playground" && request.method === "POST") {
        const res = await handlePostPlayground(request, env);
        res.headers.set("Access-Control-Allow-Origin", "*");
        return res;
      }

      if (url.pathname === "/feedback" && request.method === "POST") {
        const res = await handlePostFeedback(request, env);
        res.headers.set("Access-Control-Allow-Origin", "*");
        return res;
      }

      if (url.pathname === "/feedback" && request.method === "GET") {
        const res = await handleListFeedback(request, env);
        res.headers.set("Access-Control-Allow-Origin", "*");
        return res;
      }

      const feedbackMatch = url.pathname.match(/^\/feedback\/([^/]+)$/);
      if (feedbackMatch) {
        if (request.method === "PATCH") {
          const res = await handleUpdateFeedback(feedbackMatch[1], request, env);
          res.headers.set("Access-Control-Allow-Origin", "*");
          return res;
        }
        if (request.method === "DELETE") {
          const res = await handleDeleteFeedback(feedbackMatch[1], request, env);
          res.headers.set("Access-Control-Allow-Origin", "*");
          return res;
        }
      }

      const match = url.pathname.match(/^\/playground\/([^/]+)$/);
      if (match) {
        if (request.method === "GET") {
          const res = await handleGetPlayground(match[1], env);
          res.headers.set("Access-Control-Allow-Origin", "*");
          return res;
        }
        if (request.method === "PUT") {
          const res = await handlePutPlayground(match[1], request, env);
          res.headers.set("Access-Control-Allow-Origin", "*");
          return res;
        }
        if (request.method === "DELETE") {
          const res = await handleDeletePlayground(match[1], env);
          res.headers.set("Access-Control-Allow-Origin", "*");
          return res;
        }
      }

      return json({ error: "Not found" }, 404);
    } catch (e) {
      console.error(e);
      const res = error("Internal server error", 500);
      res.headers.set("Access-Control-Allow-Origin", "*");
      return res;
    }
  },
};
