export interface ValidatedLead {
  name: string;
  email: string;
  company: string;
  phone?: string;
  trade: string;
  serviceArea: string;
  currentLeadSource: string;
  gbpUrl?: string;
  estMonthlySearches?: number;
  estCloseRate?: number;
  estTicket?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: ValidatedLead;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ALLOWED_TRADES = [
  "Plumber",
  "Electrician",
  "HVAC",
  "Roofer",
  "Landscaping / lawn care",
  "General contractor / handyman",
  "Painter",
  "Concrete / masonry",
  "Other",
] as const;

export const ALLOWED_LEAD_SOURCES = [
  "Google search (organic / Map Pack)",
  "Word of mouth / referrals",
  "Facebook / Nextdoor",
  "Paid ads (Google / Facebook)",
  "Lead-gen services (Angi, HomeAdvisor, Thumbtack)",
  "I don't really track it",
] as const;

function sanitizeString(val: any): string {
  if (typeof val !== "string") return "";
  let sanitized = val.replace(/<\/?[^>]+(>|$)/g, "");
  return sanitized.trim();
}

function clampInt(val: any, min: number, max: number): number | undefined {
  const n = typeof val === "number" ? val : parseInt(val, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function validateLeadInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["Invalid payload format."] };
  }

  const name = sanitizeString(input.name);
  const email = sanitizeString(input.email);
  const company = sanitizeString(input.company);
  const phone = input.phone !== undefined && input.phone !== null ? sanitizeString(input.phone) : undefined;
  const trade = sanitizeString(input.trade);
  const serviceArea = sanitizeString(input.serviceArea);
  const currentLeadSource = sanitizeString(input.currentLeadSource);
  const gbpUrl = input.gbpUrl !== undefined && input.gbpUrl !== null ? sanitizeString(input.gbpUrl) : undefined;

  if (!name) {
    errors.push("Name is required.");
  } else if (name.length > 100) {
    errors.push("Name must not exceed 100 characters.");
  }

  if (!email) {
    errors.push("Email is required.");
  } else if (email.length > 254) {
    errors.push("Email must not exceed 254 characters.");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Invalid email address format.");
  }

  if (!company) {
    errors.push("Business name is required.");
  } else if (company.length > 100) {
    errors.push("Business name must not exceed 100 characters.");
  }

  if (phone && phone.length > 30) {
    errors.push("Phone number must not exceed 30 characters.");
  }

  if (!trade) {
    errors.push("Trade selection is required.");
  } else if (!ALLOWED_TRADES.includes(trade as typeof ALLOWED_TRADES[number])) {
    errors.push("Invalid trade selection.");
  }

  if (!serviceArea) {
    errors.push("City and state are required.");
  } else if (serviceArea.length > 120) {
    errors.push("City and state must not exceed 120 characters.");
  }

  if (!currentLeadSource) {
    errors.push("Current lead source is required.");
  } else if (!ALLOWED_LEAD_SOURCES.includes(currentLeadSource as typeof ALLOWED_LEAD_SOURCES[number])) {
    errors.push("Invalid lead source selection.");
  }

  if (gbpUrl && gbpUrl.length > 500) {
    errors.push("Google Business Profile URL must not exceed 500 characters.");
  }

  const estMonthlySearches = clampInt(input.estMonthlySearches, 0, 100000);
  const estCloseRate = clampInt(input.estCloseRate, 0, 100);
  const estTicket = clampInt(input.estTicket, 0, 1000000);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      name,
      email,
      company,
      phone: phone || undefined,
      trade,
      serviceArea,
      currentLeadSource,
      gbpUrl: gbpUrl || undefined,
      estMonthlySearches,
      estCloseRate,
      estTicket,
    },
  };
}
