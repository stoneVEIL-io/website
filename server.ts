import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsed inputs
app.use(express.json());

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
app.post("/api/lead", async (req, res) => {
  try {
    const { name, email, company, phone, strain, process: customProcess } = req.body;
    
    if (!name || !email || !company || !strain) {
      return res.status(400).json({ error: "Missing required lead information fields." });
    }

    console.log(`Received B2B lead capture for ${name} at ${company} (${email}). Pain point selected: "${strain}"`);

    // Fetch initialized Gemini client
    const ai = getGeminiClient();
    if (!ai) {
      // Return beautiful mock recommendation fallback if API key is not yet set
      return res.json({
        success: true,
        score: "HIGH",
        recommendations: [
          {
            title: `Automate manual data entry for "${strain}"`,
            description: `Connect your primary intake forms to structured databases (such as Airtable or Google Sheets) using simple webhooks to save up to 4 hours per week.`,
            roi: "Estimated weekly savings: 4.5 hours | ROI achieved in 6 days."
          },
          {
            title: "Instant Lead Follow-Up Sequence",
            description: "Whenever a client requests details on your website, trigger a personalized email immediately using template APIs in under 60 seconds.",
            roi: "Conversion boost: 22% expected increase in booking rates."
          },
          {
            title: "Unified Billing Integration",
            description: "Link your timesheets or accounting triggers directly to QuickBooks and coordinate client reminders automatically.",
            roi: "Saves up to 5 hours per month in administrative chase-down."
          }
        ],
        summary: `We successfully logged your pain point: "${strain}". Standard client-side fallback plan generated. To unlock full AI-powered scoring, add a valid Gemini API key in Settings > Secrets!`
      });
    }

    // Build specialized prompt for business workflow audit recommendations
    const prompt = `
      You are a world-class Conversion Rate Optimization & B2B SaaS Growth Engineer specializing in SMB automation for company "stoneVEIL Operations LLC".
      
      You have captured a qualified lead from:
      - Owner/Representative: ${name}
      - Business/Company Name: ${company}
      - Business Email: ${email}
      - Phone Number: ${phone || "Not provided"}
      - Primary Operational Time Drain: "${strain}"
      - Current Process Details: "${customProcess || "Not provided"}"
      
      Create a highly professional, scannable workflow audit recommendation plan.
      You must respond with a strictly formatted JSON object containing:
      1. "score": "LOW", "MEDIUM", or "HIGH" (qualifying potential for automation based on their time drain complexity).
      2. "recommendations": An array of exactly 3 detailed automation tactics. Each tactic must have:
         - "title": Short action-oriented title (e.g., "Automate Client Onboarding Ingest")
         - "description": Practical, 2-line explanation of how to connect their favorite apps to solve this. Keep it humble, direct, and zero technical jargon.
         - "roi": Short impact projection (e.g., "Estimated Weekly Savings: 3.5 hours.")
      3. "summary": A warm, encouraging 2-sentence closing statement that refers directly to the target caller and invites them to book a free call to deploy this.
      
      Response format must be valid, parseable JSON:
      {
        "score": "HIGH",
        "recommendations": [
          { "title": "...", "description": "...", "roi": "..." },
          { "title": "...", "description": "...", "roi": "..." },
          { "title": "...", "description": "...", "roi": "..." }
        ],
        "summary": "..."
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
      // Construct hardcoded structural recovery
      parsedResult = {
        score: "HIGH",
        recommendations: [
          {
            title: `Integrate Custom API Hooks for "${strain}"`,
            description: "Automatically transfer client intake entries straight to your primary admin panels hands-free.",
            roi: "Est. Weekly Savings: 5 hours."
          },
          {
            title: "Automate Scheduled Communications",
            description: "Configure standard templates that notify both your internal CRM team and external clients upon milestone changes.",
            roi: "Reduces manual messaging latency to zero."
          },
          {
            title: "Consolidate CSV and Billing Ingests",
            description: "Connect payment processors directly to spreadsheets to automatically reconcile accounts receivable on a set cron schedule.",
            roi: "Saves 4 hours on administrative invoicing every billing cycle."
          }
        ],
        summary: `Your operational strain in "${strain}" represents a prime candidate for immediate automation. Claim your Free discovery call to review these deployment steps with our engineers!`
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
