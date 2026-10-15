// Tiny stand-in for the Supabase API gateway: routes /auth/v1 to GoTrue and /rest/v1 to PostgREST.
// Local development and CI only.
import http from "node:http";

const PORT = Number(process.env.GATEWAY_PORT || 54321);
const routes = [
  ["/auth/v1", Number(process.env.AUTH_PORT || 9999)],
  ["/rest/v1", Number(process.env.REST_PORT || 3001)],
];

http
  .createServer((req, res) => {
    const route = routes.find(([prefix]) => req.url === prefix || req.url.startsWith(prefix + "/") || req.url.startsWith(prefix + "?"));
    if (!route) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end('{"message":"no route"}');
      return;
    }
    const [prefix, port] = route;
    const path = req.url.slice(prefix.length) || "/";
    const headers = { ...req.headers, host: `127.0.0.1:${port}` };
    const upstream = http.request({ host: "127.0.0.1", port, path, method: req.method, headers }, (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    });
    upstream.on("error", (e) => {
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: String(e) }));
    });
    req.pipe(upstream);
  })
  .listen(PORT, "127.0.0.1", () => console.log(`gateway on http://127.0.0.1:${PORT}`));
