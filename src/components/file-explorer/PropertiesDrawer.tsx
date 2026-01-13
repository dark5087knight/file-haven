import { FileProperties as FilePropertiesType } from '@/types/files';
import { formatFileSize, formatDateTime, getFileType } from '@/lib/format';
import { FileIcon } from './FileIcon';
import { X, Folder, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface PropertiesDrawerProps {
  properties: FilePropertiesType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PropertyRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm font-medium break-all">{value ?? '—'}</span>
    </div>
  );
}

export function PropertiesDrawer({ properties, open, onOpenChange }: PropertiesDrawerProps) {
  if (!properties) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {properties.isDirectory ? (
                <Folder className="h-6 w-6 text-muted-foreground" />
              ) : (
                <FileIcon
                  extension={properties.extension}
                  isDirectory={false}
                  className="h-6 w-6"
                />
              )}
            </div>
            <span className="truncate">{properties.name}</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">General</h4>
          <Separator className="mb-2" />
          <PropertyRow label="Name" value={properties.name} />
          <PropertyRow label="Type" value={getFileType(properties.extension, properties.isDirectory)} />
          <PropertyRow label="Path" value={properties.path} />
          {!properties.isDirectory && (
            <PropertyRow label="Size" value={formatFileSize(properties.size)} />
          )}
          {properties.isDirectory && properties.itemCount !== undefined && (
            <PropertyRow label="Items" value={`${properties.itemCount} items`} />
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Timestamps</h4>
          <Separator className="mb-2" />
          <PropertyRow label="Created" value={formatDateTime(properties.created)} />
          <PropertyRow label="Modified" value={formatDateTime(properties.modified)} />
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Permissions</h4>
          <Separator className="mb-2" />
          <PropertyRow label="Mode" value={properties.permissions} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
