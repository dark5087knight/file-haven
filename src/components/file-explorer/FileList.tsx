import { FileItem, SortConfig, SortField } from '@/types/files';
import { FileListHeader } from './FileListHeader';
import { FileRow } from './FileRow';
import { FileListSkeleton } from './FileListSkeleton';
import { FolderOpen } from 'lucide-react';

interface FileListProps {
  items: FileItem[];
  loading: boolean;
  selectedItems: FileItem[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  onSelectItem: (item: FileItem, mode: 'single' | 'toggle' | 'range') => void;
  onOpenDirectory: (path: string) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  onProperties: (item: FileItem) => void;
  isRoot?: boolean;
}

export function FileList({
  items,
  loading,
  selectedItems,
  sortConfig,
  onSort,
  onSelectItem,
  onOpenDirectory,
  onDownload,
  onDelete,
  onProperties,
  isRoot = false,
}: FileListProps) {
  if (loading) {
    return <FileListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FolderOpen className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">This folder is empty</p>
        <p className="text-sm">No files or folders to display</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <FileListHeader sortConfig={sortConfig} onSort={onSort} />
      <div role="table">
        {items.map((item) => (
          <FileRow
            key={item.path}
            item={item}
            isSelected={selectedItems.some(i => i.path === item.path)}
            onSelect={(mode) => onSelectItem(item, mode)}
            onOpen={() => item.isDirectory && onOpenDirectory(item.path)}
            onDownload={() => onDownload(item)}
            onDelete={() => onDelete(item)}
            onProperties={() => onProperties(item)}
            isRoot={isRoot}
          />
        ))}
      </div>
    </div>
  );
}
