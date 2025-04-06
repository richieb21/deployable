"use client";

import { useState, useMemo } from "react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface FileTreeProps {
  files: string[];
  className?: string;
  highlightedFiles?: Set<string>;
}

export const FileTree = ({
  files,
  className = "",
  highlightedFiles = new Set(),
}: FileTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Convert flat file paths into a tree structure
  const fileTree = useMemo(() => {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    files.forEach((filePath) => {
      const parts = filePath.split("/");
      let currentPath = "";
      let parentNode: FileNode | undefined;

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;

        if (!pathMap.has(currentPath)) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "directory",
            children: [],
          };

          if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(node);
          } else {
            tree.push(node);
          }

          pathMap.set(currentPath, node);
        }

        parentNode = pathMap.get(currentPath);
      });
    });

    return tree;
  }, [files]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileIcon = (
    type: "file" | "directory",
    path: string,
    name: string
  ) => {
    if (type === "directory") {
      return (
        <svg
          className={`w-4 h-4 text-gray-500 transform transition-transform ${
            expandedFolders.has(path) ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      );
    }

    // File icon with different colors based on extension
    const extension = name.split(".").pop()?.toLowerCase();
    let color = "text-gray-500";

    if (extension) {
      switch (extension) {
        case "ts":
        case "tsx":
          color = "text-blue-500";
          break;
        case "py":
          color = "text-yellow-500";
          break;
        case "json":
          color = "text-orange-500";
          break;
        case "md":
          color = "text-purple-500";
          break;
        case "css":
          color = "text-pink-500";
          break;
        case "svg":
          color = "text-green-500";
          break;
      }
    }

    return (
      <svg
        className={`w-4 h-4 ${color}`}
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
    );
  };

  const renderNode = (node: FileNode, level: number = 0, index: number = 0) => {
    const { name, path, type } = node;
    const isExpanded = expandedFolders.has(path);
    const isHighlighted = highlightedFiles.has(path);

    return (
      <div
        key={path}
        style={{
          marginLeft: `${level * 8}px`,
          ...(level === 0 ? { animationDelay: `${index * 50}ms` } : {}),
        }}
        className={level === 0 ? "animate-slideDown" : ""}
      >
        <div
          className={`flex items-center space-x-1 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group ${
            isHighlighted ? "bg-green-100 dark:bg-green-900/20" : ""
          }`}
          onClick={() => type === "directory" && toggleFolder(path)}
        >
          {renderFileIcon(type, path, name)}
          <span
            className={`text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors ${
              isHighlighted ? "text-green-600 dark:text-green-400" : ""
            }`}
          >
            {name}
          </span>
        </div>
        {type === "directory" && isExpanded && node.children && (
          <div>
            {node.children.map((child, childIndex) =>
              renderNode(child, level + 1, index + childIndex)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`font-mono text-sm ${className}`}>
      {fileTree.map((node, index) => renderNode(node, 0, index))}
    </div>
  );
};
