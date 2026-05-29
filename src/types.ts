export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  company: string;
  trade: string;
  serviceArea: string;
  currentLeadSource: string;
  gbpUrl?: string;
  estMonthlySearches?: number;
  estCloseRate?: number;
  estTicket?: number;
}

export interface AutomationRecommendation {
  title: string;
  description: string;
  roi: string;
}

export interface AuditResponse {
  success: boolean;
  tier: 'hot' | 'warm' | 'cold';
  score: number;
  recommendations: AutomationRecommendation[];
  summary: string;
  topMissingFromGBP: string[];
  calendlyUrl: string | null;
}
