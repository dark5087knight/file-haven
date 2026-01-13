import { FileItem, SortConfig, SortField } from '@/types/files';
import { FileListHeader } from './FileListHeader';
import { FileRow } from './FileRow';
import { FileListSkeleton } from './FileListSkeleton';
import { FolderOpen } from 'lucide-react';

interface FileListProps {
  items: FileItem[];
  loading: boolean;
  selectedItem: FileItem | null;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  onSelectItem: (item: FileItem) => void;
  onOpenDirectory: (path: string) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  onProperties: (item: FileItem) => void;
}

export function FileList({
  items,
  loading,
  selectedItem,
  sortConfig,
  onSort,
  onSelectItem,
  onOpenDirectory,
  onDownload,
  onDelete,
  onProperties,
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
            isSelected={selectedItem?.path === item.path}
            onSelect={() => onSelectItem(item)}
            onOpen={() => item.isDirectory && onOpenDirectory(item.path)}
            onDownload={() => onDownload(item)}
            onDelete={() => onDelete(item)}
            onProperties={() => onProperties(item)}
          />
        ))}
      </div>
    </div>
  );
}
