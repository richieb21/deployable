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

export interface CreateIssueRequest {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

export interface IssueResponse {
  url: string;
  html_url: string;
  number: number;
  title: string;
  state: string;
}

export interface IdentifyKeyFilesRequest {
  repo_url: string;
}

export interface IdentifyKeyFilesResponse {
  all_files: string[];
  key_files: {
    frontend: string[];
    backend: string[];
    infra: string[];
  };
}
