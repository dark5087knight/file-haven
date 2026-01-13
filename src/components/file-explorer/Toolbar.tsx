import { RefreshCw, Search, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onNavigateUp: () => void;
  canNavigateUp: boolean;
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  onNavigateUp,
  canNavigateUp,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
      <Button
        variant="ghost"
        size="icon"
        onClick={onNavigateUp}
        disabled={!canNavigateUp}
        title="Go up (Backspace)"
        className="h-9 w-9"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        title="Refresh"
        className="h-9 w-9"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
    </div>
  );
}
