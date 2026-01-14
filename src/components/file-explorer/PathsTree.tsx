import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, HardDrive, Folder } from 'lucide-react';
import { fetchRoots, RootConfig } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface PathsTreeProps {
  currentRootId?: string;
  onSwitchRoot: (rootId: string) => void;
  refreshTrigger?: number;
}

export function PathsTree({ currentRootId, onSwitchRoot, refreshTrigger }: PathsTreeProps) {
  const [roots, setRoots] = useState<RootConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['system', 'user']));

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchRoots()
      .then((data) => {
        if (!active) return;
        setRoots(data);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentRootId, refreshTrigger]); // Reload when root changes or refresh is triggered

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Separate roots into system and user paths
  // System paths are those that root users see but regular users don't
  // System paths typically have id 'root' or path '/'
  const systemRoots = roots.filter((r) => r.id === 'root' || r.path === '/');
  const userRoots = roots.filter((r) => r.id !== 'root' && r.path !== '/');
  
  // If there are no system roots, don't show the system section
  // If there are no user roots, don't show the user section

  if (loading) {
    return (
      <div className="p-2 space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* System Paths Section */}
      {systemRoots.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('system')}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            {expandedSections.has('system') ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            <HardDrive className="h-4 w-4 flex-shrink-0" />
            <span>System Paths</span>
          </button>
          {expandedSections.has('system') && (
            <div className="ml-4">
              {systemRoots.map((root) => {
                const isActive = currentRootId === root.id;
                return (
                  <button
                    key={root.id}
                    onClick={() => onSwitchRoot(root.id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors hover:bg-accent ${
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                    style={{ paddingLeft: '24px' }}
                  >
                    <Folder className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{root.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* User Paths Section */}
      {userRoots.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('user')}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            {expandedSections.has('user') ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            <Folder className="h-4 w-4 flex-shrink-0" />
            <span>User Paths</span>
          </button>
          {expandedSections.has('user') && (
            <div className="ml-4">
              {userRoots.map((root) => {
                const isActive = currentRootId === root.id;
                return (
                  <button
                    key={root.id}
                    onClick={() => onSwitchRoot(root.id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors hover:bg-accent ${
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                    style={{ paddingLeft: '24px' }}
                  >
                    <Folder className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{root.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {roots.length === 0 && (
        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
          No paths available
        </div>
      )}
    </div>
  );
}
