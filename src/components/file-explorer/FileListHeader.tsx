import { ChevronUp, ChevronDown } from 'lucide-react';
import { SortConfig, SortField } from '@/types/files';

interface FileListHeaderProps {
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

export function FileListHeader({ sortConfig, onSort }: FileListHeaderProps) {
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
      <button
        onClick={() => onSort('name')}
        className="col-span-5 flex items-center gap-1 text-left hover:text-foreground transition-colors"
      >
        Name
        <SortIndicator field="name" />
      </button>
      <div className="col-span-2">Type</div>
      <button
        onClick={() => onSort('size')}
        className="col-span-2 flex items-center gap-1 text-left hover:text-foreground transition-colors"
      >
        Size
        <SortIndicator field="size" />
      </button>
      <button
        onClick={() => onSort('modified')}
        className="col-span-2 flex items-center gap-1 text-left hover:text-foreground transition-colors"
      >
        Modified
        <SortIndicator field="modified" />
      </button>
      <div className="col-span-1 text-right">Actions</div>
    </div>
  );
}
