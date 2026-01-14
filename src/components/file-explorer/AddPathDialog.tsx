import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createPath, PathCreate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface AddPathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPathDialog({ open, onOpenChange, onSuccess }: AddPathDialogProps) {
  const [type, setType] = useState<'system' | 'user'>('user');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [pathValue, setPathValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !pathValue) {
      toast({
        title: 'Validation Error',
        description: 'ID and path are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const pathData: PathCreate = { 
        type, 
        id, 
        name: type === 'system' ? (name || undefined) : undefined,
        path: pathValue 
      };
      await createPath(pathData);
      toast({
        title: 'Success',
        description: `Path ${id} created successfully`,
      });
      // Reset form
      setId('');
      setName('');
      setPathValue('');
      setType('user');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to create path',
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
            Add New Path
          </DialogTitle>
          <DialogDescription>
            Create a new system or user path. ID must be unique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="path-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'system' | 'user')} disabled={loading}>
                <SelectTrigger id="path-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Path</SelectItem>
                  <SelectItem value="user">User Path</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="path-id">ID</Label>
              <Input
                id="path-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g., downloads, anime"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Unique identifier for this path</p>
            </div>
            {type === 'system' && (
              <div className="space-y-2">
                <Label htmlFor="path-name">Name</Label>
                <Input
                  id="path-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name (optional)"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Leave empty to use endpoint directory name</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="path-value">Path</Label>
              <Input
                id="path-value"
                value={pathValue}
                onChange={(e) => setPathValue(e.target.value)}
                placeholder="e.g., /mnt/anime, /mnt/jilly/movies"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Full system path to the directory</p>
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
            <Button type="submit" disabled={loading || !id || !pathValue}>
              {loading ? 'Creating...' : 'Create Path'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
