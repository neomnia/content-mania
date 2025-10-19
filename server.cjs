// server.cjs
const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;      // Plesk injecte PORT
const host = process.env.HOST || "0.0.0.0"; // écoute sur toutes les interfaces

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.set("trust proxy", true);

  // Healthcheck utile
  server.get("/healthz", (_req, res) => res.status(200).send("ok"));

  // (tes routes custom ici)

  server.all("*", (req, res) => handle(req, res));

  const listener = server.listen(port, host, () => {
    console.log(`✅ Next+Express running on http://${host}:${port} (env: ${process.env.NODE_ENV})`);
  });

  const shutdown = () => listener.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
