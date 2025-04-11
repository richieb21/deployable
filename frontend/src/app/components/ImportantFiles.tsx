"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
  const [animatedFiles, setAnimatedFiles] = useState<Set<string>>(new Set());

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
      setTimeout(
        () => {
          setVisibleFiles((prev) => ({
            ...prev,
            [lastVisibleSection]: [...prev[lastVisibleSection], file],
          }));

          // If file is already highlighted, add it to animated files after a short delay
          if (highlightedFiles.has(file)) {
            setTimeout(() => {
              setAnimatedFiles((prev) => new Set([...prev, file]));
            }, 100);
          }
        },
        100 * (index + 1)
      );
    });
  }, [visibleSections, key_files, highlightedFiles]);

  // Add newly highlighted files to animated files
  useEffect(() => {
    highlightedFiles.forEach((file) => {
      if (
        visibleFiles.frontend.includes(file) ||
        visibleFiles.backend.includes(file) ||
        visibleFiles.infra.includes(file)
      ) {
        setAnimatedFiles((prev) => new Set([...prev, file]));
      }
    });
  }, [highlightedFiles, visibleFiles]);

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
        <div className="relative overflow-hidden rounded">
          {highlightedFiles.has(file) && (
            <motion.div
              className="absolute inset-0 bg-green-800/20 dark:bg-green-500/30"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
                delay: animatedFiles.has(file) ? 0 : 0.1,
              }}
              onAnimationComplete={() => {
                if (!animatedFiles.has(file)) {
                  setAnimatedFiles((prev) => new Set([...prev, file]));
                }
              }}
              style={{ originX: 0 }}
            />
          )}
          <span
            className={`relative z-10 inline-block text-sm px-2 py-1 rounded transition-colors ${
              highlightedFiles.has(file)
                ? "text-green-800 dark:text-green-400"
                : "text-gray-950 dark:text-gray-300"
            }`}
          >
            {file}
          </span>
        </div>
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
        <h2 className="text-base text-gray-500 dark:text-gray-500 mb-2">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </h2>
        <div className="pl-4 border-l border-gray-200 dark:border-gray-800 space-y-2">
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
