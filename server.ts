import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { db } from "./lib/db";
import { leads } from "./lib/schema";
import { validateLeadInput } from "./lib/validation";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const IS_PROD = process.env.NODE_ENV === "production";

// Enable trust proxy in production behind Cloud Run reverse proxies
if (IS_PROD) {
  app.set("trust proxy", 1);
}

// Enable helmet for security headers
// Configure CSP rules dynamically: strict in production, permissive in dev for Vite HMR
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"], // Strip unsafe-inline and unsafe-eval in production
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
          },
        }
      : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://*"],
            connectSrc: ["'self'", "https://*"],
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

    // Persist validated lead to Neon database
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
      });
      console.log(`Successfully stored lead in database for ${email}`);
    } catch (dbError) {
      // Log DB error but don't fail the request — the contractor still sees their audit.
      console.error("Failed to persist lead to Neon database:", dbError);
    }

    // Fetch initialized Gemini client
    const ai = getGeminiClient();
    if (!ai) {
      // Sandbox fallback when GEMINI_API_KEY is not configured
      return res.json({
        success: true,
        score: "HIGH",
        recommendations: [
          {
            title: `Fix the Google Business Profile basics for ${company}`,
            description: `Most ${trade.toLowerCase()} profiles in ${serviceArea} are missing hours, photos, or service categories — quick wins that lift Map-Pack ranking within a week.`,
            roi: "Recovers visibility on the searches you're already losing."
          },
          {
            title: "Instant text-back when you can't pick up",
            description: "Automated SMS reply within 60 seconds of any missed call, with a link to a quote form. Closes the gap between the phone ringing and the homeowner calling the next guy.",
            roi: "Captures the missed-call leads currently dying in voicemail."
          },
          {
            title: "After-hours coverage that books while you sleep",
            description: `Weekend and after-5pm inquiries get acknowledged immediately and qualified into your inbox by morning. Pairs with your current "${currentLeadSource}" channel without replacing it.`,
            roi: "No more Monday-morning lead ghosting."
          }
        ],
        summary: `Sandbox preview for ${company} (${trade}, ${serviceArea}) — placeholder recommendations. Set GEMINI_API_KEY on the server to run the live Google Profile audit.`
      });
    }

    // Phase 2.1 prompt — minimal contractor framing. Phase 2.2 retargets this
    // to feed GBP data, add a prompt-injection guard, and emit hot/warm/cold tier.
    const prompt = `
      You are an audit specialist for Stoneveil Operations, a service that helps 2-5 person trade contractors win more local jobs through a better Google Business Profile and an automated lead-response loop.

      You're auditing this contractor:
      - Owner: ${name}
      - Business: ${company}
      - Email: ${email}
      - Trade: ${trade}
      - Service area: ${serviceArea}
      - Where most of their leads come from today: "${currentLeadSource}"
      - Their own estimate (from the leads calculator): ~${estMonthlySearches ?? "unknown"} monthly local searches, ~${estCloseRate ?? "unknown"}% close rate, ~$${estTicket ?? "unknown"} avg ticket.

      Write a tight, practical audit. Respond ONLY with valid JSON, no markdown fences.
      {
        "score": "LOW" | "MEDIUM" | "HIGH",  // fit for the Stoneveil offer based on trade + lead-source + scale
        "recommendations": [                  // exactly 3 items
          {
            "title": "short action-oriented title",
            "description": "2 sentences max. Specific to ${trade} in ${serviceArea}. No jargon. Speak as if to the contractor directly.",
            "roi": "one-line impact: extra jobs, recovered leads, or visibility — no fake hours-saved numbers"
          }
        ],
        "summary": "2 sentences. Refer to ${name} by name and invite a 15-minute discovery call."
      }
    `;

    // Query Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text ? response.text.trim() : "";
    console.log("Successfully generated AI workflow recommendations for lead!");

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Could not parse JSON response from Gemini, raw response was:", resultText);
      parsedResult = {
        score: "MEDIUM",
        recommendations: [
          {
            title: `Tighten the Google Business Profile for ${company}`,
            description: `Most ${trade.toLowerCase()} GBPs in ${serviceArea} are missing hours, photos, or service categories. Filling those out lifts you in the Map Pack within a week.`,
            roi: "Recovers visibility on searches you're already losing."
          },
          {
            title: "Instant text-back for missed calls",
            description: "Auto-SMS reply within 60 seconds when a call goes to voicemail, with a one-tap link to a quote form.",
            roi: "Captures missed-call leads instead of losing them to the next contractor on the list."
          },
          {
            title: "After-hours acknowledgement",
            description: `Weekend and after-5pm inquiries get an immediate auto-reply and a qualified summary in your inbox by morning — pairs with your "${currentLeadSource}" channel.`,
            roi: "No more Monday-morning ghosting."
          }
        ],
        summary: `Recovery fallback used: the AI returned unparseable JSON. These are sane defaults for ${company} in ${serviceArea} — review and refine on the discovery call.`
      };
    }

    return res.json({
      success: true,
      ...parsedResult
    });

  } catch (error) {
    console.error("Error handling lead capture:", error);
    res.status(500).json({ error: "Failed to process lead database entries or generate AI workflow suggestions." });
  }
});

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
