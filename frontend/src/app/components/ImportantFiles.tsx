"use client";

import { useState, useEffect } from "react";

interface ImportantFilesProps {
  key_files: {
    frontend: string[];
    backend: string[];
    infra: string[];
  };
  highlightedFiles?: Set<string>;
}

type StackCategory = "frontend" | "backend" | "infra";

export const ImportantFiles = ({
  key_files,
  highlightedFiles = new Set(),
}: ImportantFilesProps) => {
  const [visibleSections, setVisibleSections] = useState<StackCategory[]>([]);
  const [visibleFiles, setVisibleFiles] = useState<
    Record<StackCategory, string[]>
  >({
    frontend: [],
    backend: [],
    infra: [],
  });

  useEffect(() => {
    const sections: StackCategory[] = ["frontend", "backend", "infra"];
    let currentIndex = 0;

    const showNextSection = () => {
      if (currentIndex >= sections.length) return;

      const section = sections[currentIndex];
      setVisibleSections((prev) => [...prev, section]);

      // Calculate total animation time for files in this section
      const fileAnimationDuration = key_files[section].length * 100 + 300; // 100ms per file + 300ms buffer

      // Schedule next section after current section's files are done
      setTimeout(() => {
        currentIndex++;
        showNextSection();
      }, fileAnimationDuration);
    };

    // Start the sequence
    showNextSection();
  }, [key_files]);

  // When section becomes visible, show its files
  useEffect(() => {
    const lastVisibleSection = visibleSections[visibleSections.length - 1];
    if (!lastVisibleSection || !key_files[lastVisibleSection]) return;

    key_files[lastVisibleSection].forEach((file, index) => {
      setTimeout(() => {
        setVisibleFiles((prev) => ({
          ...prev,
          [lastVisibleSection]: [...prev[lastVisibleSection], file],
        }));
      }, 100 * (index + 1));
    });
  }, [visibleSections, key_files]);

  const renderFiles = (files: string[], section: StackCategory) => {
    return files.map((file) => (
      <div
        key={file}
        className={`transform transition-all duration-300 ${
          visibleFiles[section].includes(file)
            ? "translate-y-0 opacity-100"
            : "translate-y-[-8px] opacity-0"
        }`}
      >
        <span
          className={`text-sm text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors ${
            highlightedFiles.has(file)
              ? "bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400"
              : ""
          }`}
        >
          {file}
        </span>
      </div>
    ));
  };

  const renderSection = (title: StackCategory, files: string[]) => {
    const isVisible = visibleSections.includes(title);

    return (
      <div
        className={`mb-6 transform transition-all duration-500 ease-out ${
          isVisible
            ? "translate-x-0 opacity-100"
            : "translate-x-[20px] opacity-0"
        }`}
      >
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </h2>
        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
          {renderFiles(files, title)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSection("frontend", key_files.frontend)}
      {renderSection("backend", key_files.backend)}
      {renderSection("infra", key_files.infra)}
    </div>
  );
};

interface KeyFileCategoryProps {
  category: string;
  title: string;
  files: string[];
  highlightedFiles: Set<string>;
}

const KeyFileCategory = ({
  category,
  title,
  files,
  highlightedFiles,
}: KeyFileCategoryProps) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h3>
      <ul className="space-y-2">
        {files.map((file) => {
          const isHighlighted = highlightedFiles.has(file);
          return (
            <li
              key={file}
              className={`text-sm text-gray-600 dark:text-gray-400 px-2 py-1 rounded transition-colors ${
                isHighlighted
                  ? "bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400"
                  : ""
              }`}
            >
              {file}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
