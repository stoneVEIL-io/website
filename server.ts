import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { db } from "./lib/db";
import { leads } from "./lib/schema";
import { validateLeadInput } from "./lib/validation";
import { fetchGbpData } from "./lib/gbp";
import { runAudit, buildFallbackAudit } from "./lib/gemini";
import { sendAuditEmail } from "./lib/email";
import { generateDemoPage } from "./lib/demo";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const IS_PROD = process.env.NODE_ENV === "production";

// Enable trust proxy in production behind Cloud Run reverse proxies
if (IS_PROD) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    // HSTS: 1-year max-age, prod only.
    // Dev runs over HTTP — sending HSTS there would lock the browser to HTTPS on localhost.
    hsts: IS_PROD
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,

    contentSecurityPolicy: IS_PROD
      ? {
          directives: {
            defaultSrc: ["'self'"],
            // No unsafe-inline or unsafe-eval — Vite's prod bundle doesn't need them.
            scriptSrc: ["'self'", "https://plausible.io"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            // Browser connects to our /api and Plausible for event tracking.
            // All other third-party calls (Gemini, Neon, Resend, Places) are server-side.
            connectSrc: ["'self'", "https://plausible.io"],
          },
        }
      : {
          // Dev: permissive to allow Vite HMR WebSocket and hot-reload connections.
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*"],
            connectSrc: ["'self'", "https://*", "ws://*", "wss://*"],
          },
        },
  })
);

// Enable JSON body parsed inputs with limit to prevent DoS
app.use(express.json({ limit: "10kb" }));

// Set up rate limiter for lead generation endpoint (max 5 requests per 15 minutes per IP)
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many lead audit requests from this IP. Please try again after 15 minutes."
  }
});

// Initialize server-side Gemini safely
// Securely loaded via process.env.GEMINI_API_KEY
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Warning: GEMINI_API_KEY is not defined in the workspace secrets.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health check — /healthz is intercepted by Cloud Run's probe layer, use /api/health
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// API Endpoint: Capture Lead and Generate Instant Custom Audit Recommendations using Gemini
app.post("/api/lead", leadLimiter, async (req, res) => {
  try {
    // Validate and sanitize input payload to prevent prompt injection or spam
    const validation = validateLeadInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", details: validation.errors });
    }

    const {
      name,
      email,
      company,
      trade,
      serviceArea,
      currentLeadSource,
      estMonthlySearches,
      estCloseRate,
      estTicket,
    } = validation.data!;

    console.log(`Received lead: ${name} at ${company} — ${trade} in ${serviceArea}, lead source: "${currentLeadSource}"`);

    // Fetch GBP data and run AI audit concurrently where possible
    const auditParams = {
      name,
      email,
      company,
      trade,
      serviceArea,
      currentLeadSource,
      estMonthlySearches,
      estCloseRate,
      estTicket,
      gbpData: null as Awaited<ReturnType<typeof fetchGbpData>>,
    };

    // GBP fetch is non-blocking — failure degrades gracefully to null
    auditParams.gbpData = await fetchGbpData(company, serviceArea);

    const ai = getGeminiClient();
    const audit = ai
      ? await runAudit(auditParams, ai)
      : buildFallbackAudit(auditParams);

    console.log(`Audit complete for ${email}: score=${audit.score} tier=${audit.tier}`);

    // Persist lead with qualification data
    try {
      await db.insert(leads).values({
        name,
        email,
        company,
        trade,
        serviceArea,
        currentLeadSource,
        estMonthlySearches: estMonthlySearches ?? null,
        estCloseRate: estCloseRate ?? null,
        estTicket: estTicket ?? null,
        qualificationScore: audit.score,
        qualificationTier: audit.tier,
      });
      console.log(`Lead persisted for ${email}`);
    } catch (dbError) {
      console.error("Failed to persist lead to database:", dbError);
    }

    const calendlyUrl = buildCalendlyUrl(audit.tier, name, email);

    // Fire-and-forget — email failure never blocks the response
    sendAuditEmail({ name, email, company, trade, serviceArea, audit, calendlyUrl }).catch((err) => {
      console.error("sendAuditEmail failed (non-fatal):", err);
    });

    return res.json({
      success: true,
      tier: audit.tier,
      score: audit.score,
      recommendations: audit.recommendations,
      summary: audit.summary,
      topMissingFromGBP: audit.topMissingFromGBP,
      calendlyUrl,
    });

  } catch (error) {
    console.error("Error handling lead capture:", error);
    res.status(500).json({ error: "Failed to process lead database entries or generate AI workflow suggestions." });
  }
});

// Admin: demo page generator — disabled if ADMIN_PASSWORD is not set
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!ADMIN_PASSWORD) {
    res.status(404).end();
    return;
  }
  const auth = req.headers["authorization"] ?? "";
  const [scheme, encoded] = auth.split(" ");
  if (scheme?.toLowerCase() !== "basic" || !encoded) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Stoneveil Admin"');
    res.status(401).end();
    return;
  }
  const [, password] = Buffer.from(encoded, "base64").toString().split(":");
  if (password !== ADMIN_PASSWORD) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Stoneveil Admin"');
    res.status(401).end();
    return;
  }
  next();
}

const ADMIN_FORM_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Demo Generator · Stoneveil</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;width:100%;max-width:480px}
    h1{font-size:22px;font-weight:800;margin-bottom:6px}
    .sub{color:#94a3b8;font-size:13px;margin-bottom:28px}
    label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    input{width:100%;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;color:#fff;font-size:15px;margin-bottom:20px;outline:none}
    input:focus{border-color:#6366f1}
    button{width:100%;background:#f59e0b;color:#1e293b;font-weight:800;font-size:15px;padding:14px;border:none;border-radius:8px;cursor:pointer}
    button:disabled{opacity:0.5;cursor:not-allowed}
    .note{font-size:11px;color:#64748b;text-align:center;margin-top:16px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Demo Page Generator</h1>
    <p class="sub">Enter a contractor's business name and location to generate a demo website for the discovery call.</p>
    <form method="POST" action="/admin/demo" onsubmit="this.querySelector('button').disabled=true;this.querySelector('button').textContent='Generating (up to 30s)…'">
      <label for="b">Business Name</label>
      <input id="b" name="businessName" type="text" placeholder="Acme Plumbing" required autocomplete="off" />
      <label for="c">City, State</label>
      <input id="c" name="cityState" type="text" placeholder="Denver, CO" required autocomplete="off" />
      <button type="submit">Generate Demo Page →</button>
    </form>
    <p class="note">Fetches live GBP data · Gemini-generated copy · ~15–30 s</p>
  </div>
</body>
</html>`;

app.get("/admin/demo", requireAdminAuth, (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(ADMIN_FORM_HTML);
});

app.post(
  "/admin/demo",
  requireAdminAuth,
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const businessName = (req.body?.businessName ?? "").toString().trim().slice(0, 120);
    const cityState = (req.body?.cityState ?? "").toString().trim().slice(0, 120);

    if (!businessName || !cityState) {
      res.status(400).send("businessName and cityState are required");
      return;
    }

    try {
      const html = await generateDemoPage(businessName, cityState);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      console.error("Demo generation failed:", err);
      res.status(500).send("Demo generation failed — check GEMINI_API_KEY and server logs.");
    }
  }
);

function buildCalendlyUrl(tier: string, name: string, email: string): string | null {
  if (tier !== "hot") return null;
  const base = process.env.CALENDLY_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.searchParams.set("name", name);
    url.searchParams.set("email", email);
    return url.toString();
  } catch {
    return base;
  }
}

// Configure Vite or Static Asset Serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite client middleware dynamically
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicit route for raw standalone HTML preview
    app.get("/landing.html", (req, res) => {
      res.sendFile(path.join(process.cwd(), "public", "landing.html"));
    });
  } else {
    // Production Mode: Serve standard compiled assets
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve public folder as static fallback
    app.use(express.static(path.join(process.cwd(), "public")));
    app.use(express.static(distPath));
    
    app.get("/landing.html", (req, res) => {
      res.sendFile(path.join(process.cwd(), "public", "landing.html"));
    });

    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
