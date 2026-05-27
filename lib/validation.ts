export interface ValidatedLead {
  name: string;
  email: string;
  company: string;
  phone?: string;
  strain: string;
  process?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: ValidatedLead;
}

// Simple email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Allowed strain options
const ALLOWED_STRAINS = [
  "Customer follow-ups & CRM",
  "Invoicing & payments",
  "Scheduling & calendar",
  "Reporting & data entry",
  "Lead generation & intake",
  "Other"
];

/**
 * Strips HTML tags from a string to prevent XSS/injection attacks.
 */
function sanitizeString(val: any): string {
  if (typeof val !== "string") return "";
  // Strip HTML tags
  let sanitized = val.replace(/<\/?[^>]+(>|$)/g, "");
  // Trim whitespace
  return sanitized.trim();
}

/**
 * Validates and sanitizes the lead input payload.
 */
export function validateLeadInput(input: any): ValidationResult {
  const errors: string[] = [];
  
  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["Invalid payload format."] };
  }

  // Sanitize fields
  const name = sanitizeString(input.name);
  const email = sanitizeString(input.email);
  const company = sanitizeString(input.company);
  const phone = input.phone !== undefined && input.phone !== null ? sanitizeString(input.phone) : undefined;
  const strain = sanitizeString(input.strain);
  const processStr = input.process !== undefined && input.process !== null ? sanitizeString(input.process) : undefined;

  // Validate Name
  if (!name) {
    errors.push("Name is required.");
  } else if (name.length > 100) {
    errors.push("Name must not exceed 100 characters.");
  }

  // Validate Email
  if (!email) {
    errors.push("Email is required.");
  } else if (email.length > 254) {
    errors.push("Email must not exceed 254 characters.");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Invalid email address format.");
  }

  // Validate Company
  if (!company) {
    errors.push("Company is required.");
  } else if (company.length > 100) {
    errors.push("Company name must not exceed 100 characters.");
  }

  // Validate Phone (optional)
  if (phone && phone.length > 30) {
    errors.push("Phone number must not exceed 30 characters.");
  }

  // Validate Strain
  if (!strain) {
    errors.push("Operational bottleneck strain selection is required.");
  } else if (!ALLOWED_STRAINS.includes(strain)) {
    errors.push("Invalid operational bottleneck selection.");
  }

  // Validate Process (optional)
  if (processStr && processStr.length > 1000) {
    errors.push("Process description must not exceed 1000 characters.");
  }

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
      strain,
      process: processStr || undefined
    }
  };
}
