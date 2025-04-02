export enum IssueCategory {
  SECURITY = "SECURITY",
  PERFORMANCE = "PERFORMANCE",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  RELIABILITY = "RELIABILITY",
  COMPLIANCE = "COMPLIANCE",
  COST = "COST",
}

export enum Severity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

export interface AnalysisRequest {
  repo_url: string;
  api_key?: string;
}

export interface CodeSnippet {
  before?: string;
  after?: string;
}

export interface Recommendation {
  title: string;
  description: string;
  file_path: string;
  severity: string;
  category: string;
  action_items?: string[];
  code_snippets?: CodeSnippet;
  references?: string[];
}

export interface AnalysisResponse {
  repository: string;
  recommendations: Recommendation[];
  analysis_timestamp: string;
}
