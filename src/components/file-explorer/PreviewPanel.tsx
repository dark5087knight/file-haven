import { useState, useEffect } from 'react';
import { FileItem, FilePreview as FilePreviewType } from '@/types/files';
import { formatFileSize } from '@/lib/format';
import { FileIcon } from './FileIcon';
import { X, Download, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { fetchPreview } from '@/lib/api';

interface PreviewPanelProps {
  item: FileItem | null;
  rootId?: string;
  onClose: () => void;
  onDownload: () => void;
}

export function PreviewPanel({ item, rootId, onClose, onDownload }: PreviewPanelProps) {
  const [preview, setPreview] = useState<FilePreviewType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item || item.isDirectory) {
      setPreview(null);
      return;
    }

    setLoading(true);
    let active = true;
    fetchPreview(item.path, rootId)
      .then(data => {
        if (!active) return;
        setPreview(data);
      })
      .catch(err => {
        if (!active) return;
        toast({
          title: 'Preview unavailable',
          description: (err as Error).message,
          variant: 'destructive',
        });
        setPreview({ path: item.path, type: 'unsupported', size: item.size });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item, rootId]);

  if (!item) return null;

  if (item.isDirectory) {
    return (
      <div className="w-80 border-l border-border bg-card flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-medium truncate">{item.name}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-muted-foreground">
          <FileIcon extension={null} isDirectory={true} className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-sm">Folder selected</p>
          <p className="text-xs mt-1">{item.itemCount ?? 0} items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-medium truncate flex-1">{item.name}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {!loading && preview && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {preview.type === 'text' && (
            <ScrollArea className="flex-1 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                {preview.content}
              </pre>
            </ScrollArea>
          )}

          {preview.type === 'json' && (
            <ScrollArea className="flex-1 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                {preview.content}
              </pre>
            </ScrollArea>
          )}

          {preview.type === 'image' && (
            <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
              <div className="text-center">
                <FileIcon extension={item.extension} isDirectory={false} className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">Image Preview</p>
                <p className="text-xs text-muted-foreground mt-1">{formatFileSize(preview.size)}</p>
              </div>
            </div>
          )}

          {preview.type === 'unsupported' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-muted-foreground">
              <FileX className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-sm font-medium">Preview not available</p>
              <p className="text-xs mt-1 text-center">
                This file type cannot be previewed
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        <p>{formatFileSize(item.size)}</p>
      </div>
    </div>
  );
}
