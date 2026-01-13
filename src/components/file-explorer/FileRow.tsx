import { Download, MoreVertical, Trash2, Info } from 'lucide-react';
import { FileItem } from '@/types/files';
import { FileIcon } from './FileIcon';
import { formatFileSize, formatDate, getFileType } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileRowProps {
  item: FileItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onProperties: () => void;
}

export function FileRow({
  item,
  isSelected,
  onSelect,
  onOpen,
  onDownload,
  onDelete,
  onProperties,
}: FileRowProps) {
  const handleDoubleClick = () => {
    if (item.isDirectory) {
      onOpen();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (item.isDirectory) {
        onOpen();
      } else {
        onSelect();
      }
    }
  };

  return (
    <div
      className={`grid grid-cols-12 gap-4 px-4 py-2.5 items-center cursor-pointer transition-colors border-b border-border/50 hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
    >
      <div className="col-span-5 flex items-center gap-3 min-w-0">
        <FileIcon extension={item.extension} isDirectory={item.isDirectory} />
        <span className="truncate font-medium">{item.name}</span>
      </div>
      <div className="col-span-2 text-muted-foreground text-sm truncate">
        {getFileType(item.extension, item.isDirectory)}
      </div>
      <div className="col-span-2 text-muted-foreground text-sm">
        {formatFileSize(item.size)}
      </div>
      <div className="col-span-2 text-muted-foreground text-sm">
        {formatDate(item.modified)}
      </div>
      <div className="col-span-1 flex items-center justify-end gap-1">
        {!item.isDirectory && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onProperties}>
              <Info className="h-4 w-4 mr-2" />
              Properties
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
