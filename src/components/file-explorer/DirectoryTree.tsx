import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { TreeNode } from '@/types/files';
import { getMockTree } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

interface DirectoryTreeProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  currentPath: string;
  onNavigate: (path: string) => void;
}

function TreeItem({ node, level, currentPath, onNavigate }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(
    currentPath === node.path || currentPath.startsWith(node.path + '/')
  );
  const hasChildren = node.children && node.children.length > 0;
  const isActive = currentPath === node.path;

  useEffect(() => {
    if (currentPath === node.path || currentPath.startsWith(node.path + '/')) {
      setIsExpanded(true);
    }
  }, [currentPath, node.path]);

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onNavigate(node.path);
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors hover:bg-accent ${
          isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        {isActive ? (
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              level={level + 1}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DirectoryTree({ currentPath, onNavigate }: DirectoryTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setTree(getMockTree());
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 12}px` }}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          level={0}
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
