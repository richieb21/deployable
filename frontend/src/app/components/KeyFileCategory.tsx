import { IdentifyKeyFilesResponse } from "../types/api";

interface KeyFileCategoryProps {
  category: keyof IdentifyKeyFilesResponse["key_files"];
  title: string;
  files: string[];
}

export function KeyFileCategory({
  category,
  title,
  files,
}: KeyFileCategoryProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      {Array.isArray(files) && files.length > 0 ? (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file}
              className="flex items-center space-x-2 p-2 text-sm rounded-lg bg-orange-50 dark:bg-orange-900/20"
            >
              <svg
                className="w-4 h-4 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{file}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No {category} files identified
        </p>
      )}
    </div>
  );
}
