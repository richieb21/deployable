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

export type Recommendation = {
  title: string;
  description: string;
  file_path: string;
  severity: Severity;
  category: IssueCategory;
  action_items: string[];
};

export interface AnalysisRequest {
  repo_url: string;
}

export interface AnalysisResponse {
  repository: string;
  recommendations?: Recommendation[];
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
