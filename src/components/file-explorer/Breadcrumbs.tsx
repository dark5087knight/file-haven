import { useState } from 'react';
import { ChevronRight, Upload, Home, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadFileDialog } from './UploadFileDialog';
import { CreateDirectoryDialog } from './CreateDirectoryDialog';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
  currentPath: string;
  rootId?: string;
  onUploadSuccess: () => void;
}

export function Breadcrumbs({ items, onNavigate, currentPath, rootId, onUploadSuccess }: BreadcrumbsProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createDirectoryDialogOpen, setCreateDirectoryDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card">
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {items.map((item, index) => (
            <div key={item.path} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              <button
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors hover:bg-accent ${
                  index === items.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {index === 0 && <Home className="h-4 w-4" />}
                <span>{item.name}</span>
              </button>
            </div>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setCreateDirectoryDialogOpen(true)}
          title="Create directory"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setUploadDialogOpen(true)}
          title="Upload file"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
      <CreateDirectoryDialog
        open={createDirectoryDialogOpen}
        onOpenChange={setCreateDirectoryDialogOpen}
        currentPath={currentPath}
        rootId={rootId}
        onSuccess={onUploadSuccess}
      />
      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentPath={currentPath}
        rootId={rootId}
        onSuccess={onUploadSuccess}
      />
    </>
  );
}
