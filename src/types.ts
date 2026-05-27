export interface LeadFormData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  strain: string;
  process?: string;
}

export interface AutomationRecommendation {
  title: string;
  description: string;
  roi: string;
}

export interface AuditResponse {
  success: boolean;
  score: "LOW" | "MEDIUM" | "HIGH";
  recommendations: AutomationRecommendation[];
  summary: string;
}
