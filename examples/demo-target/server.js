const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromVariant = createRequire(path.join(process.cwd(), "package.json"));
const express = requireFromVariant("express");
const app = express();
const port = Number(process.env.CIVIBASTION_DEMO_PORT);
const hardened = process.env.CIVIBASTION_DEMO_HARDENED === "true";

app.disable("x-powered-by");

if (hardened) {
  app.use((_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Security-Policy", "default-src 'none'");
    next();
  });
}

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    target: "civibastion-local-demo",
    mode: hardened ? "patched" : "baseline",
  });
});

app.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Local demo target listening on 127.0.0.1:${port}\n`);
});
