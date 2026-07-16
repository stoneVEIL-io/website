import "dotenv/config";
import { timingSafeEqual } from "crypto";
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { desc } from "drizzle-orm";
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

// Global baseline rate limit — generous ceiling that blunts broad hammering of any
// route (static assets, /api/health) not covered by the per-endpoint limiters below.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: false,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Lead endpoint: 5 requests per 15 minutes per IP
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "Too many lead audit requests from this IP. Please try again after 15 minutes." },
});

// Admin demo endpoint: 20 requests per hour per IP (single operator, generous headroom)
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "Too many admin requests." },
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

    const maskedEmail = email.replace(/(?<=^.{3})[^@]+(?=@)/, "***");
    console.log(`Received lead: ${name} at ${company} — ${trade} in ${serviceArea}, source: "${currentLeadSource}"`);

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

    console.log(`Audit complete for ${maskedEmail}: score=${audit.score} tier=${audit.tier}`);

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
      console.log(`Lead persisted for ${maskedEmail}`);
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
  // Use indexOf to preserve colons within the password itself
  const decoded = Buffer.from(encoded, "base64").toString();
  const colonIdx = decoded.indexOf(":");
  const password = colonIdx >= 0 ? decoded.slice(colonIdx + 1) : "";

  // Constant-time comparison to prevent timing oracle attacks
  let authorised = false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(ADMIN_PASSWORD);
    authorised = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    authorised = false;
  }

  if (!authorised) {
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
  <link rel="stylesheet" href="/admin.css" />
</head>
<body class="admin-body">
  <div class="admin-card-center">
    <h1>Demo Page Generator</h1>
    <p class="admin-subtitle">Enter a contractor's business name and location to generate a demo website for the discovery call.</p>
    <form method="POST" action="/admin/demo" onsubmit="this.querySelector('button').disabled=true;this.querySelector('button').textContent='Generating (up to 30s)…'">
      <label class="admin-label" for="b">Business Name</label>
      <input id="b" name="businessName" class="admin-input" type="text" placeholder="Acme Plumbing" required autocomplete="off" />
      <label class="admin-label" for="c">City, State</label>
      <input id="c" name="cityState" class="admin-input" type="text" placeholder="Denver, CO" required autocomplete="off" />
      <button class="admin-button-primary" type="submit">Generate Demo Page →</button>
    </form>
    <p class="admin-note">Fetches live GBP data · Gemini-generated copy · ~15–30 s</p>
  </div>
</body>
</html>`;

app.get("/admin/demo", adminLimiter, requireAdminAuth, (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(ADMIN_FORM_HTML);
});

app.post(
  "/admin/demo",
  adminLimiter,
  requireAdminAuth,
  express.urlencoded({ extended: false, limit: "2kb" }),
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

app.get("/admin/dashboard", adminLimiter, requireAdminAuth, async (_req, res) => {
  try {
    const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
    const html = buildDashboardHtml(allLeads);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Failed to render admin dashboard:", err);
    res.status(500).send("Failed to render admin dashboard — check database connection.");
  }
});

function buildDashboardHtml(leadsList: any[]): string {
  const esc = (s: any): string => {
    if (s == null) return "";
    return s.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  };

  const total = leadsList.length;
  const hot = leadsList.filter(l => l.qualificationTier === 'hot').length;
  const warm = leadsList.filter(l => l.qualificationTier === 'warm').length;
  const cold = leadsList.filter(l => l.qualificationTier === 'cold').length;

  const rowsHtml = leadsList.map(l => {
    const dateStr = new Date(l.createdAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const tierBadgeClass = l.qualificationTier === 'hot' ? 'hot' : l.qualificationTier === 'warm' ? 'warm' : 'cold';
    const tierLabel = l.qualificationTier ? l.qualificationTier.toUpperCase() : "PENDING";
    const scoreVal = l.qualificationScore !== null ? `${l.qualificationScore}/100` : "N/A";

    return `
      <tr class="lead-row" data-name="${esc(l.name.toLowerCase())}" data-company="${esc(l.company.toLowerCase())}" data-trade="${esc(l.trade.toLowerCase())}" data-area="${esc(l.serviceArea.toLowerCase())}" data-tier="${esc(l.qualificationTier || 'pending')}">
        <td class="admin-text-date">${esc(dateStr)}</td>
        <td>
          <div class="admin-company-name">${esc(l.company)}</div>
          <div class="admin-lead-name">${esc(l.name)}</div>
        </td>
        <td>
          <div class="admin-lead-trade">${esc(l.trade)}</div>
          <div class="admin-lead-area">📍 ${esc(l.serviceArea)}</div>
        </td>
        <td class="admin-lead-source" title="${esc(l.currentLeadSource)}">${esc(l.currentLeadSource)}</td>
        <td>
          <span class="admin-badge ${tierBadgeClass}">${esc(tierLabel)}</span>
          <span class="admin-score-val">${esc(scoreVal)}</span>
        </td>
        <td>
          <div><a href="mailto:${esc(l.email)}" class="admin-email-link">${esc(l.email)}</a></div>
          ${l.phone ? `<div><a href="tel:${esc(l.phone.replace(/\D/g,''))}" class="admin-phone-link">📞 ${esc(l.phone)}</a></div>` : ''}
        </td>
        <td class="admin-align-right">
          <button class="admin-action-btn admin-demo-btn" data-company="${esc(l.company)}" data-area="${esc(l.serviceArea)}">Generate Demo →</button>
        </td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Leads Dashboard · Stoneveil</title>
  <link rel="stylesheet" href="/admin.css" />
</head>
<body class="admin-body">
  <div class="admin-container">
    <header class="admin-header">
      <div>
        <h1 class="admin-title">stoneVEIL Leads Dashboard</h1>
        <p class="admin-subtitle">Review and qualify inbound trade contractor leads</p>
      </div>
      <div>
        <a href="/admin/demo" class="admin-nav-btn">← Demo Generator</a>
      </div>
    </header>

    <div class="admin-metrics">
      <div class="admin-metric-card total">
        <div class="admin-metric-title">Total Leads</div>
        <div class="admin-metric-value">${total}</div>
      </div>
      <div class="admin-metric-card hot">
        <div class="admin-metric-title">Hot Leads</div>
        <div class="admin-metric-value">${hot}</div>
      </div>
      <div class="admin-metric-card warm">
        <div class="admin-metric-title">Warm Leads</div>
        <div class="admin-metric-value">${warm}</div>
      </div>
      <div class="admin-metric-card cold">
        <div class="admin-metric-title">Cold Leads</div>
        <div class="admin-metric-value">${cold}</div>
      </div>
    </div>

    <div class="admin-controls">
      <div class="admin-search-box">
        <input type="text" id="searchInput" placeholder="Search by name, company, trade, or city..." autocomplete="off" />
      </div>
      <div class="admin-filter-box">
        <select id="tierFilter">
          <option value="all">All Tiers</option>
          <option value="hot">Hot Only</option>
          <option value="warm">Warm Only</option>
          <option value="cold">Cold Only</option>
        </select>
      </div>
    </div>

    <div class="admin-table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Lead Details</th>
              <th>Trade & Location</th>
              <th>Source</th>
              <th>Qualification</th>
              <th>Contact Info</th>
              <th class="admin-align-right">Actions</th>
            </tr>
          </thead>
          <tbody id="leadsBody">
            ${rowsHtml || `<tr><td colspan="7" class="admin-no-leads">No leads captured yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const searchInput = document.getElementById('searchInput');
    const tierFilter = document.getElementById('tierFilter');
    const rows = document.querySelectorAll('.lead-row');

    function filterLeads() {
      const query = searchInput.value.toLowerCase().trim();
      const selectedTier = tierFilter.value;

      rows.forEach(row => {
        const name = row.getAttribute('data-name');
        const company = row.getAttribute('data-company');
        const trade = row.getAttribute('data-trade');
        const area = row.getAttribute('data-area');
        const tier = row.getAttribute('data-tier');

        const matchesSearch = !query || 
          name.includes(query) || 
          company.includes(query) || 
          trade.includes(query) || 
          area.includes(query);

        const matchesTier = selectedTier === 'all' || tier === selectedTier;

        if (matchesSearch && matchesTier) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    searchInput.addEventListener('input', filterLeads);
    tierFilter.addEventListener('change', filterLeads);

    // Delegated handler for the per-row "Generate Demo" buttons. Values are read from
    // data-* attributes via dataset (inert data) — never interpolated into executable
    // JS — so a lead's company/serviceArea can never break out into script.
    document.getElementById('leadsBody').addEventListener('click', function (e) {
      const btn = e.target.closest('.admin-demo-btn');
      if (!btn) return;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/admin/demo';
      form.target = '_blank';
      const bInput = document.createElement('input');
      bInput.name = 'businessName';
      bInput.value = btn.dataset.company;
      const cInput = document.createElement('input');
      cInput.name = 'cityState';
      cInput.value = btn.dataset.area;
      form.appendChild(bInput);
      form.appendChild(cInput);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
  </script>
</body>
</html>`;
}

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
    console.warn("CALENDLY_URL is not a valid URL — Calendly link disabled.");
    return null;
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
