import { Resend } from "resend";
import type { AuditResult } from "./audit";

export interface SendAuditEmailParams {
  name: string;
  email: string;
  company: string;
  trade: string;
  serviceArea: string;
  audit: AuditResult;
  calendlyUrl: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildRecommendationRow(rec: { title: string; description: string; roi: string }): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #6366f1;padding:16px;border-radius:8px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e293b;line-height:1.4;">${esc(rec.title)}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.65;">${esc(rec.description)}</p>
          <p style="margin:0;font-size:12px;color:#059669;font-weight:600;">⚡ ${esc(rec.roi)}</p>
        </td>
      </tr>
    </table>`;
}

function buildGbpGapsSection(gaps: string[]): string {
  if (gaps.length === 0) return "";
  const items = gaps
    .map(
      (g) =>
        `<tr><td style="padding:5px 0;font-size:13px;color:#92400e;line-height:1.5;">&#9888;&#xFE0F; ${esc(g)}</td></tr>`
    )
    .join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fffbeb;border:1px solid #fde68a;padding:16px;border-radius:8px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:1px;font-family:monospace;">Quick wins spotted in your Google Profile</p>
          <table width="100%" cellpadding="0" cellspacing="0">${items}</table>
        </td>
      </tr>
    </table>`;
}

function buildCtaSection(tier: "hot" | "warm" | "cold", calendlyUrl: string | null): string {
  if (tier === "hot" && calendlyUrl) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#0F1929;padding:24px;border-radius:10px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#ffffff;">Based on your profile, you're a strong fit for the Stoneveil offer.</p>
            <p style="margin:0 0 20px;font-size:13px;color:#94a3b8;line-height:1.6;">Book a free 15-minute Google Profile review — I'll walk you through your 3 biggest gaps and what fixing them is worth to your business.</p>
            <a href="${esc(calendlyUrl)}" style="display:inline-block;background:#f59e0b;color:#1e293b;font-weight:800;font-size:14px;text-decoration:none;padding:14px 28px;border-radius:8px;">Book your free 15-minute call &rarr;</a>
            <p style="margin:14px 0 0;font-size:11px;color:#64748b;">No commitment. If the audit doesn't surface 3 actionable wins, you don't pay.</p>
          </td>
        </tr>
      </table>`;
  }

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:10px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1e293b;">&#128197; We'll follow up within 1 business day.</p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">I'll review your Google Profile and reach out directly to walk through where the biggest gaps are for your business. Reply to this email if you'd like to move faster.</p>
        </td>
      </tr>
    </table>`;
}

function buildEmailHtml(params: SendAuditEmailParams): string {
  const { name, company, trade, serviceArea, audit, calendlyUrl } = params;
  const firstName = name.split(" ")[0];

  const recsHtml = audit.recommendations.map(buildRecommendationRow).join("");
  const gbpGapsHtml = buildGbpGapsSection(audit.topMissingFromGBP);
  const ctaHtml = buildCtaSection(audit.tier, calendlyUrl);

  const tierLabel = audit.tier === "hot" ? "Strong fit" : audit.tier === "warm" ? "Good fit" : "Under review";
  const tierColor = audit.tier === "hot" ? "#f59e0b" : audit.tier === "warm" ? "#6366f1" : "#94a3b8";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background:#0F1929;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">stone<span style="color:#6366f1;">VEIL</span> <span style="font-size:11px;color:#94a3b8;font-family:monospace;background:rgba(255,255,255,0.07);padding:3px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.12);">Operations</span></p>
                    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Google Profile Audit &mdash; ${esc(company)} &middot; ${esc(serviceArea)}</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;color:${esc(tierColor)};font-family:monospace;text-transform:uppercase;letter-spacing:1px;">${esc(tierLabel)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 20px;font-size:16px;color:#1e293b;font-weight:400;">Hi ${esc(firstName)},</p>

              <p style="margin:0 0 28px;font-size:14px;line-height:1.75;color:#475569;">${esc(audit.summary)}</p>

              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;font-family:monospace;">Your 3 Recommended Quick Wins</p>

              ${recsHtml}

              ${gbpGapsHtml}

              ${ctaHtml}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                This audit was generated for <strong style="color:#64748b;">${esc(company)}</strong> (${esc(trade)}) in ${esc(serviceArea)}.<br>
                Reply to this email &mdash; it goes straight to my inbox. I read every one.<br>
                <span style="color:#cbd5e1;">stoneVEIL Operations LLC</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAuditEmail(params: SendAuditEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or EMAIL_FROM not set — email skipped.");
    return;
  }

  const resend = new Resend(apiKey);
  const { name, email, company, serviceArea } = params;
  const firstName = name.split(" ")[0];

  const subject =
    params.audit.tier === "hot"
      ? `${firstName}, your Stoneveil audit is ready — book your 15-min call`
      : `Your Google Profile audit for ${company} in ${serviceArea}`;

  const html = buildEmailHtml(params);

  const { error } = await resend.emails.send({
    from,
    to: email,
    replyTo: from,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`Audit email sent to ${email} (tier: ${params.audit.tier})`);
}
