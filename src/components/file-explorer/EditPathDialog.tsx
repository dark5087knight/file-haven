import { useState, useEffect } from 'react';
import { FolderCog } from 'lucide-react';
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
import { updatePath, PathUpdate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface EditPathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: { id: string; name: string; path: string; type: 'system' | 'user' } | null;
  onSuccess: () => void;
}

export function EditPathDialog({ open, onOpenChange, path, onSuccess }: EditPathDialogProps) {
  const [name, setName] = useState('');
  const [pathValue, setPathValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (path) {
      setName(path.name);
      setPathValue(path.path);
    }
  }, [path]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!path) return;

    if (!pathValue) {
      toast({
        title: 'Validation Error',
        description: 'Path is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updates: PathUpdate = {};
      if (path.type === 'system' && name !== path.name) {
        updates.name = name;
      }
      if (pathValue !== path.path) {
        updates.path = pathValue;
      }
      
      if (Object.keys(updates).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes were made',
        });
        onOpenChange(false);
        return;
      }

      await updatePath(path.id, updates);
      toast({
        title: 'Success',
        description: `Path ${path.id} updated successfully`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to update path',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!path) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderCog className="h-5 w-5" />
            Edit Path: {path.id}
          </DialogTitle>
          <DialogDescription>
            Update path name and location. Changes will be applied immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-path-id">ID</Label>
              <Input
                id="edit-path-id"
                value={path.id}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">ID cannot be changed</p>
            </div>
            {path.type === 'system' && (
              <div className="space-y-2">
                <Label htmlFor="edit-path-name">Name</Label>
                <Input
                  id="edit-path-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-path-value">Path</Label>
              <Input
                id="edit-path-value"
                value={pathValue}
                onChange={(e) => setPathValue(e.target.value)}
                placeholder="e.g., /mnt/anime"
                disabled={loading}
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
            <Button type="submit" disabled={loading || !pathValue}>
              {loading ? 'Updating...' : 'Update Path'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
