import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFileSync } from "node:fs";
import express from "express";

// X-Forwarded-For as GFE presents it: [attacker-prepended, real client, GFE's own hop]
const XFF = "9.9.9.9, 1.2.3.4, 5.6.7.8";

function ipFor(trustProxy) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.set("trust proxy", trustProxy);
    app.get("/ip", (req, res) => res.end(req.ip));
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      http.get({ host: "127.0.0.1", port, path: "/ip", headers: { "X-Forwarded-For": XFF } }, (res) => {
        let body = ""; res.on("data", (c) => (body += c));
        res.on("end", () => { server.close(); resolve(body); });
      }).on("error", (e) => { server.close(); reject(e); });
    });
  });
}
const src = () => readFileSync(new URL("../server.ts", import.meta.url), "utf8");

// STO-59 live check: set DEBUG_CLIENT_IP=1 on the Cloud Run revision to log the
// resolved req.ip + the raw X-Forwarded-For chain. Confirms trust proxy=2 yields
// varied REAL client IPs (not the shared GFE IP). Off by default — logs nothing
// unless the env var is set, so it's safe to leave in the codebase.
if (process.env.DEBUG_CLIENT_IP === "1") {
  app.use((req, _res, next) => {
    console.log(`[client-ip] ip=${req.ip} xff="${req.headers["x-forwarded-for"] ?? ""}"`);
    next();
  });
}

test("trust proxy 2 -> real client IP", async () => assert.equal(await ipFor(2), "1.2.3.4"));
test("trust proxy 2 ignores attacker-prepended IP", async () => assert.notEqual(await ipFor(2), "9.9.9.9"));
test("trust proxy 2 does not fall back to GFE shared IP", async () => assert.notEqual(await ipFor(2), "5.6.7.8"));
test("trust proxy 1 (the bug) -> GFE shared IP", async () => assert.equal(await ipFor(1), "5.6.7.8"));
test("source guard: server.ts ships trust proxy 2", () => assert.match(src(), /app\.set\(\s*["']trust proxy["']\s*,\s*2\s*\)/));
test("source guard: server.ts no longer ships trust proxy 1", () => assert.doesNotMatch(src(), /app\.set\(\s*["']trust proxy["']\s*,\s*1\s*\)/));
