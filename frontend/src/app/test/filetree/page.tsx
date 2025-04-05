"use client";

import { ImportantFiles } from "@/app/components/ImportantFiles";
import { FileTree } from "../../components/FileTree";

const sampleFiles = [
  "README.md",
  "backend/app/__init__.py",
  "backend/app/api/endpoints/analysis.py",
  "backend/app/api/endpoints/github.py",
  "backend/app/core/config.py",
  "backend/app/core/logging_config.py",
  "backend/app/main.py",
  "backend/app/mcp/.python-version",
  "backend/app/mcp/README.md",
  "backend/app/mcp/context/clients.txt",
  "backend/app/mcp/context/githubMCP.txt",
  "backend/app/mcp/context/plan.txt",
  "backend/app/mcp/context/writingMcpClients.txt",
  "backend/app/mcp/github_api_client.py",
  "backend/app/mcp/github_client.py",
  "backend/app/mcp/hello.py",
  "backend/app/mcp/pyproject.toml",
  "backend/app/models/schemas.py",
  "backend/app/services/deepseek_service.py",
  "backend/app/services/github.py",
  "backend/app/services/openai_service.py",
  "backend/requirements.txt",
  "frontend/README.md",
  "frontend/eslint.config.mjs",
  "frontend/next.config.ts",
  "frontend/postcss.config.mjs",
  "frontend/public/deployable.png",
  "frontend/public/file.svg",
  "frontend/public/globe.svg",
  "frontend/public/next.svg",
  "frontend/public/vercel.svg",
  "frontend/public/window.svg",
  "frontend/src/app/api/analysis/route.ts",
  "frontend/src/app/components/Features.tsx",
  "frontend/src/app/components/Footer.tsx",
  "frontend/src/app/components/Header.tsx",
  "frontend/src/app/components/Hero.tsx",
  "frontend/src/app/favicon.ico",
  "frontend/src/app/fonts.ts",
  "frontend/src/app/globals.css",
  "frontend/src/app/layout.tsx",
  "frontend/src/app/page.tsx",
  "frontend/src/app/types/api.ts",
  "frontend/tsconfig.json",
  "sample.json",
  "tailwind.config.js",
];

const key_files = {
  frontend: [
    "client/index.html",
    "client/src/main.jsx",
    "client/vite.config.js",
  ],
  backend: ["server/.env", "server/models/Conversation.js", "server/server.js"],
  infra: ["client/index.html", "client/src/main.jsx", "client/vite.config.js"],
};

export default function FileTreeTestPage() {
  return (
    <div className="min-h-screen bg-[#FFFAF5] dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            FileTree Component Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the FileTree component with sample repository data
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Repository Structure
            </h2>
            <FileTree files={sampleFiles} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Important Files
            </h2>
            <ImportantFiles key_files={key_files} />
          </div>
        </div>
      </div>
    </div>
  );
}
