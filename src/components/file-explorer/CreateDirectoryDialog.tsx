import { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createDirectory } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface CreateDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  rootId?: string;
  onSuccess: () => void;
}

export function CreateDirectoryDialog({ open, onOpenChange, currentPath, rootId, onSuccess }: CreateDirectoryDialogProps) {
  const [directoryName, setDirectoryName] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset directory name when dialog closes
  useEffect(() => {
    if (!open) {
      setDirectoryName('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!directoryName || directoryName.trim() === '') {
      toast({
        title: 'Directory name required',
        description: 'Please enter a directory name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createDirectory(currentPath, directoryName.trim(), rootId);
      toast({
        title: 'Success',
        description: `Directory "${directoryName.trim()}" created successfully`,
      });
      setDirectoryName('');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to create directory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create Directory
          </DialogTitle>
          <DialogDescription>
            Create a new directory in: {currentPath}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="directory-name">Directory Name</Label>
              <Input
                id="directory-name"
                value={directoryName}
                onChange={(e) => setDirectoryName(e.target.value)}
                placeholder="Enter directory name"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !directoryName.trim()}>
              {loading ? 'Creating...' : 'Create Directory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
