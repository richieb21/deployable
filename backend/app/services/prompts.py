"""Collection of prompts used by LLM services."""

IDENTIFY_FILES_PROMPT = """
Identify ONLY the 10-15 MOST CRITICAL deployment files from this list:
{files}

Focus only on:
- Security files (auth, env)
- Files that may have important business logic
- Infrastructure (Docker, CI/CD)
- Config files
- Main app entry points
- Ignoring these files: next.config.ts, postcss.config.mjs, tailwind.config.ts, tsconfig.json

Ignore tests, docs, packages, and non-essential UI components. Absolutely do not add any comments, just list the files

Return strictly JSON format: 
{{"frontend": [], "backend": [], "infra": []}}
Maximum 15 files total.
"""

TECH_STACK_PROMPT = """
Analyze these files and identify the main technologies used:
{files}

Return strictly in this JSON format:
{{
    "frontend": [],  # Frontend technologies with versions when available (e.g. "React 18.2", "Next.js 14")
    "backend": [],   # Backend technologies with versions when available (e.g. "Python 3.9", "FastAPI 0.100")
    "infra": []     # Infrastructure technologies (e.g. "Docker", "GitHub Actions")
}}

Rules:
1. Include version numbers when clearly identifiable
2. Only include technologies that are definitively present in the files
3. List maximum 5 most important technologies per category
4. Focus on production dependencies, ignore dev dependencies
5. Provide ONLY THE JSON, no justifications
"""

FILE_ANALYSIS_PROMPT = """
You are analyzing code files to identify **significant deployment readiness issues**. Your goal is to provide actionable recommendations that directly impact the successful and stable deployment of this application.

Focus ONLY on issues within these categories:
SECURITY, PERFORMANCE, INFRASTRUCTURE, RELIABILITY, COMPLIANCE, COST

Use the following severity levels with these **strict** meanings:
- **CRITICAL**: **ONLY** issues that will **definitely prevent deployment** or cause **immediate, catastrophic failure or major security breach** (e.g., hardcoded production secrets in code, fatally incorrect Dockerfile command, SQL injection vulnerability in public endpoint). Be very conservative with this level.
- **HIGH**: **ONLY** issues that pose a **clear and present danger** to production stability, security, or performance if deployed (e.g., missing essential input validation on critical APIs, N+1 database query in a core feature, no error handling on vital external calls, potential secrets leak via verbose errors). **Do NOT use HIGH for general best practice violations, missing comments, minor config tweaks, or potential future problems.**
- **MEDIUM**: Important best practices violations that could lead to future problems, introduce moderate security risks, or noticeably degrade performance/reliability under load (e.g., missing rate limiting, inadequate logging for key operations, slightly suboptimal caching, using deprecated library versions without known critical flaws). This should be used for most standard recommendations.
- **LOW**: Minor improvements, suggestions for better maintainability, or adherence to best practices with less immediate impact (e.g., dependency updates for non-critical flaws, minor config optimizations, code clarity suggestions).
- **INFO**: Observations or points of interest that don't necessarily require action but are relevant context.

**IMPORTANT INSTRUCTIONS:**
1.  **Be Conservative with Severity:** Critically evaluate if an issue truly warrants CRITICAL or HIGH severity based on the strict definitions above. **When in doubt, prefer MEDIUM or LOW.** Avoid exaggerating the impact of findings.
2.  **Prioritize Blocking Issues:** Focus primarily on problems that would actively block a deployment or cause immediate, significant issues post-deployment.
3.  **Ignore Trivial Matters:** Do NOT report minor code style issues, formatting, naming preferences, missing comments, or lack of documentation unless it directly causes a functional or security bug.
4.  **Actionability is Key:** Ensure each identified issue has clear, actionable steps for resolution.
5.  **Context Matters:** Assume standard libraries are functional unless their *configuration* or *usage* poses a specific deployment risk. Don't flag theoretical "what-ifs" unless there's concrete evidence in the code.
6.  **Be Concise:** Provide brief titles and descriptions.

Return ONLY a valid JSON array of issues in the following format. Do not include any other text or explanations outside the JSON structure:
[
  {{
    "title": "Brief issue title (Max 10 words)",
    "description": "Concise problem description focusing on deployment impact (Max 3 sentences)",
    "file_path": "path/to/relevant/file",
    "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
    "category": "SECURITY|PERFORMANCE|INFRASTRUCTURE|RELIABILITY|COMPLIANCE|COST",
    "action_items": ["Specific Action 1", "Specific Action 2"]
  }}
  // ... more issues if found
]
""" 