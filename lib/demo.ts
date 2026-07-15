import type { GoogleGenAI } from "@google/genai";
import type { GbpData } from "./gbp";
import { fetchGbpData } from "./gbp";
import { getAiClient, AI_MODEL } from "./ai";

export interface DemoInput {
  businessName: string;
  trade: string;
  cityState: string;
  gbpData: GbpData | null;
}

interface DemoCopy {
  tagline: string;
  heroSub: string;
  services: Array<{ name: string; description: string; emoji: string }>;
  trustPoints: Array<{ heading: string; body: string }>;
  ctaHeadline: string;
  ctaBody: string;
  ctaText: string;
}

const FALLBACK_COPY: DemoCopy = {
  tagline: "Local Experts. Fast. Done Right.",
  heroSub: "We handle the job so you don't have to worry. Licensed, insured, and trusted by homeowners across the area.",
  services: [
    { name: "Residential Service", description: "Fast, reliable service for homeowners — no runaround.", emoji: "🏠" },
    { name: "Emergency Calls", description: "Available when you need us most, including nights and weekends.", emoji: "📞" },
    { name: "Free Estimates", description: "Honest pricing upfront — no surprise charges at the end.", emoji: "📋" },
    { name: "Quality Guarantee", description: "We stand behind every job with a satisfaction guarantee.", emoji: "✅" },
  ],
  trustPoints: [
    { heading: "Fast Response", body: "We reply within 60 seconds and arrive the same day in most cases." },
    { heading: "No Hidden Fees", body: "You get a written quote before any work starts. What we quote is what you pay." },
    { heading: "5-Star Rated", body: "Consistently top-rated by homeowners in the local area." },
  ],
  ctaHeadline: "Ready to get it done?",
  ctaBody: "Call or text now — most jobs are scheduled within 24 hours.",
  ctaText: "Get a Free Quote",
};

function buildGbpPromptSection(gbp: GbpData): string {
  const lines = [
    `GBP name: ${gbp.name}`,
    `Rating: ${gbp.rating ?? "N/A"} stars (${gbp.reviewCount} reviews)`,
    `Phone: ${gbp.phone ?? "not listed"}`,
    `Hours: ${gbp.hours ? gbp.hours.slice(0, 3).join("; ") : "not listed"}`,
    `Editorial summary: ${gbp.editorialSummary ?? "none"}`,
  ];
  if (gbp.topReviews.length > 0) {
    lines.push(
      "Sample reviews: " +
        gbp.topReviews
          .slice(0, 2)
          .map((r) => `"${r.text?.slice(0, 80) ?? ""}"`)
          .join(" | ")
    );
  }
  return lines.join("\n");
}

async function generateCopy(input: DemoInput, ai: GoogleGenAI): Promise<DemoCopy> {
  const gbpSection = input.gbpData
    ? `Google Business Profile data:\n${buildGbpPromptSection(input.gbpData)}`
    : "No GBP data available — generate generic but credible copy.";

  const prompt = `You are a professional copywriter for local contractor websites. Write website copy for a mockup/demo page.

${gbpSection}

Business name: ${input.businessName}
Trade: ${input.trade}
Location: ${input.cityState}

Generate exactly this JSON (no markdown fences, no extra keys):
{
  "tagline": "punchy hero headline, 5-8 words, specific to the trade — not generic",
  "heroSub": "2 sentences: what they do, why homeowners choose them, area served",
  "services": [
    {"name": "service name", "description": "one sentence, concrete benefit", "emoji": "single emoji"}
  ],
  "trustPoints": [
    {"heading": "3-4 word heading", "body": "one sentence specific to this trade or their GBP data"}
  ],
  "ctaHeadline": "final section headline, 5-8 words, creates mild urgency",
  "ctaBody": "one sentence: value prop or next-step instruction",
  "ctaText": "primary CTA button text (4 words max)"
}
Exactly 4-5 services. Exactly 3 trustPoints. No markdown.`;

  try {
    const res = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(res.text?.trim() ?? "{}");

    const recs: DemoCopy["services"] = Array.isArray(parsed.services)
      ? parsed.services.filter((s: any) => s.name && s.description).slice(0, 5)
      : [];
    const trust: DemoCopy["trustPoints"] = Array.isArray(parsed.trustPoints)
      ? parsed.trustPoints.filter((t: any) => t.heading && t.body).slice(0, 3)
      : [];

    return {
      tagline: typeof parsed.tagline === "string" ? parsed.tagline : FALLBACK_COPY.tagline,
      heroSub: typeof parsed.heroSub === "string" ? parsed.heroSub : FALLBACK_COPY.heroSub,
      services: recs.length >= 3 ? recs : FALLBACK_COPY.services,
      trustPoints: trust.length === 3 ? trust : FALLBACK_COPY.trustPoints,
      ctaHeadline: typeof parsed.ctaHeadline === "string" ? parsed.ctaHeadline : FALLBACK_COPY.ctaHeadline,
      ctaBody: typeof parsed.ctaBody === "string" ? parsed.ctaBody : FALLBACK_COPY.ctaBody,
      ctaText: typeof parsed.ctaText === "string" ? parsed.ctaText : FALLBACK_COPY.ctaText,
    };
  } catch (err) {
    console.warn("Demo copy generation failed, using fallback:", err);
    return FALLBACK_COPY;
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

// Validates that a URL has an http/https/tel scheme before using it as an href.
// Rejects javascript:, data:, and other potentially dangerous schemes.
function safeLinkHref(url: string, allowedSchemes = ["https:", "http:"]): string {
  if (!url) return "#";
  try {
    const parsed = new URL(url);
    if (!allowedSchemes.includes(parsed.protocol)) return "#";
    return escHtml(url);
  } catch {
    return "#";
  }
}

function safePhoneHref(phone: string): string {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? `tel:${digits}` : "#";
}

function buildReviewsHtml(gbp: GbpData): string {
  const reviews = gbp.topReviews.filter((r) => r.text && r.rating >= 4).slice(0, 3);
  if (reviews.length === 0) return "";

  const cards = reviews
    .map(
      (r) => `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;gap:4px;">
          ${"⭐".repeat(r.rating)}
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0;">"${escHtml(r.text?.slice(0, 220) ?? "")}"</p>
        <p style="color:#94a3b8;font-size:12px;font-weight:600;margin:0;">— ${escHtml(r.author ?? "Verified Customer")}${r.relativeTime ? ` · ${escHtml(r.relativeTime)}` : ""}</p>
      </div>`
    )
    .join("");

  return `
  <section style="padding:80px 24px;background:#f8fafc;">
    <div style="max-width:1100px;margin:0 auto;">
      <p style="color:#6366f1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-family:monospace;">What Customers Say</p>
      <h2 style="font-size:clamp(26px,4vw,36px);font-weight:800;color:#0f172a;margin:0 0 40px;letter-spacing:-0.5px;">Real Reviews from Real Homeowners</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
        ${cards}
      </div>
    </div>
  </section>`;
}

function buildHoursHtml(gbp: GbpData): string {
  if (!gbp.hours || gbp.hours.length === 0) return "";
  const items = gbp.hours
    .slice(0, 7)
    .map((h) => `<li style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${escHtml(h)}</li>`)
    .join("");
  return `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
      <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 16px;">Business Hours</h3>
      <ul style="list-style:none;margin:0;padding:0;">${items}</ul>
    </div>`;
}

export function buildDemoHtml(input: DemoInput, copy: DemoCopy): string {
  const { businessName, trade, cityState, gbpData } = input;
  const phone = gbpData?.phone ?? "";
  const phoneHref = safePhoneHref(phone);
  const rating = gbpData?.rating;
  const reviewCount = gbpData?.reviewCount ?? 0;
  const website = gbpData?.website ?? "";
  const websiteHref = safeLinkHref(website);

  const ratingBadge =
    rating != null
      ? `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:99px;padding:6px 14px;font-size:13px;color:#fcd34d;font-weight:600;">⭐ ${rating} (${reviewCount} reviews)</span>`
      : "";

  const servicesHtml = copy.services
    .map(
      (s) => `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <span style="font-size:28px;">${escHtml(s.emoji)}</span>
        <h3 style="font-size:17px;font-weight:700;color:#0f172a;margin:0;">${escHtml(s.name)}</h3>
        <p style="font-size:14px;color:#64748b;margin:0;line-height:1.65;">${escHtml(s.description)}</p>
      </div>`
    )
    .join("");

  const trustHtml = copy.trustPoints
    .map(
      (t) => `
      <div style="text-align:center;padding:24px 16px;">
        <h3 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 8px;">${escHtml(t.heading)}</h3>
        <p style="font-size:14px;color:#64748b;margin:0;line-height:1.65;max-width:260px;margin:0 auto;">${escHtml(t.body)}</p>
      </div>`
    )
    .join("");

  const reviewsSection = gbpData ? buildReviewsHtml(gbpData) : "";
  const hoursHtml = gbpData ? buildHoursHtml(gbpData) : "";

  const generatedAt = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(businessName)} | ${escHtml(trade)} in ${escHtml(cityState)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    a { text-decoration: none; }
    @media (max-width: 640px) {
      .hero-btns { flex-direction: column !important; align-items: stretch !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- DEMO PREVIEW BANNER — remove before handing off to client -->
  <div id="demo-banner" style="background:#f59e0b;color:#1e293b;text-align:center;padding:10px 24px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:16px;">
    <span>Demo Preview · Stoneveil Operations LLC · ${escHtml(generatedAt)}</span>
    <button onclick="document.getElementById('demo-banner').remove()" style="background:rgba(0,0,0,0.15);border:none;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;color:#1e293b;">Dismiss</button>
    <a href="javascript:void(0)" onclick="downloadPage()" style="background:#1e293b;color:#fff;border-radius:4px;padding:5px 12px;font-size:11px;font-weight:700;">Download HTML</a>
  </div>

  <!-- HEADER -->
  <header style="background:#0f172a;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
    <div>
      <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${escHtml(businessName)}</span>
      <span style="font-size:11px;color:#94a3b8;margin-left:10px;font-weight:500;">${escHtml(trade)} · ${escHtml(cityState)}</span>
    </div>
    ${phone ? `<a href="${phoneHref}" style="background:#f59e0b;color:#1e293b;font-weight:800;font-size:14px;padding:10px 20px;border-radius:8px;white-space:nowrap;">${escHtml(phone)}</a>` : `<a href="#contact" style="background:#f59e0b;color:#1e293b;font-weight:800;font-size:14px;padding:10px 20px;border-radius:8px;">Get a Quote</a>`}
  </header>

  <!-- HERO -->
  <section style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:100px 24px 90px;text-align:center;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 60% 40%,rgba(99,102,241,0.15) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="position:relative;z-index:1;max-width:800px;margin:0 auto;">
      <h1 style="font-size:clamp(32px,6vw,60px);font-weight:900;line-height:1.1;letter-spacing:-1px;margin:0 0 20px;">${escHtml(copy.tagline)}</h1>
      <p style="font-size:clamp(16px,2vw,20px);color:#cbd5e1;line-height:1.7;margin:0 0 36px;max-width:600px;margin-left:auto;margin-right:auto;">${escHtml(copy.heroSub)}</p>
      <div class="hero-btns" style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin:0 0 36px;">
        <a href="${phoneHref}" style="background:#f59e0b;color:#1e293b;font-weight:800;font-size:17px;padding:16px 32px;border-radius:10px;box-shadow:0 8px 24px rgba(245,158,11,0.25);">${escHtml(copy.ctaText)} →</a>
        <a href="#services" style="border:2px solid rgba(255,255,255,0.2);color:#fff;font-weight:600;font-size:16px;padding:16px 28px;border-radius:10px;">See Our Work</a>
      </div>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        ${ratingBadge}
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:99px;padding:6px 14px;font-size:13px;color:#94a3b8;font-weight:500;">📍 ${escHtml(cityState)}</span>
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:99px;padding:6px 14px;font-size:13px;color:#94a3b8;font-weight:500;">✅ Licensed &amp; Insured</span>
      </div>
    </div>
  </section>

  <!-- SERVICES -->
  <section id="services" style="padding:80px 24px;background:#fff;">
    <div style="max-width:1100px;margin:0 auto;">
      <p style="color:#6366f1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-family:monospace;">What We Do</p>
      <h2 style="font-size:clamp(26px,4vw,36px);font-weight:800;color:#0f172a;margin:0 0 40px;letter-spacing:-0.5px;">Services We Offer in ${escHtml(cityState)}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
        ${servicesHtml}
      </div>
    </div>
  </section>

  <!-- TRUST PILLARS -->
  <section style="padding:64px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
    <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">
      ${trustHtml}
    </div>
  </section>

  ${reviewsSection}

  <!-- CONTACT / CTA -->
  <section id="contact" style="padding:80px 24px;background:#0f172a;color:#fff;text-align:center;">
    <h2 style="font-size:clamp(26px,4vw,40px);font-weight:800;margin:0 0 12px;letter-spacing:-0.5px;">${escHtml(copy.ctaHeadline)}</h2>
    <p style="font-size:16px;color:#94a3b8;margin:0 0 32px;max-width:480px;margin-left:auto;margin-right:auto;">${escHtml(copy.ctaBody)}</p>
    ${phone ? `<a href="${phoneHref}" style="display:inline-block;background:#f59e0b;color:#1e293b;font-weight:800;font-size:18px;padding:18px 40px;border-radius:10px;margin:0 0 20px;">${escHtml(phone)}</a><br>` : ""}
    <div style="display:inline-flex;gap:24px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
      ${hoursHtml ? `<div style="text-align:left;min-width:240px;">${hoursHtml}</div>` : ""}
      <div style="text-align:left;min-width:200px;">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 12px;">Get in Touch</h3>
          ${phone ? `<p style="font-size:14px;color:#475569;margin:0 0 8px;">📞 <a href="${phoneHref}" style="color:#6366f1;font-weight:600;">${escHtml(phone)}</a></p>` : ""}
          <p style="font-size:14px;color:#475569;margin:0 0 8px;">📍 ${escHtml(cityState)}</p>
          ${websiteHref !== "#" ? `<p style="font-size:14px;color:#475569;margin:0;"><a href="${websiteHref}" style="color:#6366f1;font-weight:600;" target="_blank" rel="noopener noreferrer">Visit Website</a></p>` : ""}
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer style="background:#020617;color:#475569;text-align:center;padding:24px;font-size:12px;line-height:1.7;">
    <p>&copy; ${new Date().getFullYear()} ${escHtml(businessName)} · ${escHtml(cityState)}</p>
    <p style="margin-top:6px;font-size:11px;">Demo page generated by <a href="https://stoneveil.io" style="color:#6366f1;">stoneVEIL Operations LLC</a></p>
  </footer>

  <script>
  function downloadPage() {
    const banner = document.getElementById('demo-banner');
    if (banner) banner.remove();
    const html = '<!DOCTYPE html>' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '${escHtml(businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase())}-demo.html';
    a.click();
  }
  </script>

</body>
</html>`;
}

export async function generateDemoPage(businessName: string, cityState: string): Promise<string> {
  const ai = getAiClient();
  if (!ai) throw new Error("AI API key is not set (AI_API_KEY)");

  // Fetch GBP data concurrently while we start setting up
  const gbpData = await fetchGbpData(businessName, cityState);

  // Infer trade from GBP types or default
  const trade =
    gbpData?.types
      .find((t) =>
        ["plumber", "electrician", "hvac", "roofing", "landscaping", "contractor", "painter", "concrete"].some((k) =>
          t.toLowerCase().includes(k)
        )
      )
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Contractor";

  const input: DemoInput = { businessName, trade, cityState, gbpData };
  const copy = await generateCopy(input, ai);

  return buildDemoHtml(input, copy);
}
