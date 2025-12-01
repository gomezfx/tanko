import { ChevronDown, ChevronRight, Folder, Loader2 } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

export type DirectoryTreeNode = {
  name: string;
  fullPath: string;
  children: DirectoryTreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
  hasLoaded: boolean;
};

export type DirectoryTreeProps = {
  root: DirectoryTreeNode | null;
  selectedPath: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
};

const IndentGuide: React.FC<{ depth: number }> = ({ depth }) => {
  if (depth === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 flex"
      style={{ width: depth * 16 }}
    >
      {Array.from({ length: depth }).map((_, index) => (
        <span
          key={index}
          className="h-full w-4 border-l border-border/60"
          aria-hidden
        />
      ))}
    </div>
  );
};

const TreeRow: React.FC<{
  node: DirectoryTreeNode;
  depth: number;
  selectedPath: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}> = ({ node, depth, selectedPath, onToggle, onSelect }) => {
  const isSelected = node.fullPath === selectedPath;

  return (
    <div className="relative">
      <IndentGuide depth={depth} />
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-sm transition hover:bg-muted/70",
          isSelected && "bg-muted",
        )}
      >
        <button
          type="button"
          aria-label={node.isExpanded ? "Collapse" : "Expand"}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          onClick={() => onToggle(node.fullPath)}
          disabled={node.isLoading}
        >
          {node.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : node.children.length > 0 || !node.hasLoaded ? (
            node.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 truncate text-left"
          onClick={() => onSelect(node.fullPath)}
        >
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="truncate font-medium">{node.name || node.fullPath}</span>
          <span className="truncate text-xs text-muted-foreground">{node.fullPath}</span>
        </button>
      </div>
      {node.isExpanded && node.children.length > 0 && (
        <div className="pl-4">
          {node.children.map((child) => (
            <TreeRow
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DirectoryTreeView: React.FC<DirectoryTreeProps> = ({
  root,
  selectedPath,
  onToggle,
  onSelect,
}) => {
  if (!root) {
    return <p className="text-sm text-muted-foreground">Loading directories...</p>;
  }

  return (
    <div className="space-y-1">
      <TreeRow
        node={root}
        depth={0}
        selectedPath={selectedPath}
        onToggle={onToggle}
        onSelect={onSelect}
      />
      {root.isExpanded && root.children.length === 0 && (
        <p className="pl-10 text-xs text-muted-foreground">No subdirectories.</p>
      )}
      {root.isExpanded && root.children.length > 0 && (
        <div className="pl-4">
          {root.children.map((child) => (
            <TreeRow
              key={child.fullPath}
              node={child}
              depth={1}
              selectedPath={selectedPath}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
