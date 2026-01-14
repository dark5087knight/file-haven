import { useState, useEffect } from 'react';
import { FolderTree, MoreVertical, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PathInfo, PathsList, fetchPaths, deletePath as deletePathAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { AddPathDialog } from './AddPathDialog';
import { EditPathDialog } from './EditPathDialog';

interface PathsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathsDialog({ open, onOpenChange }: PathsDialogProps) {
  const [paths, setPaths] = useState<PathsList>({ systemPaths: [], userPaths: [] });
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<PathInfo & { type: 'system' | 'user' } | null>(null);

  const loadPaths = async () => {
    setLoading(true);
    try {
      const data = await fetchPaths();
      setPaths(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to load paths',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadPaths();
    }
  }, [open]);

  const handleDelete = async (pathId: string, type: 'system' | 'user') => {
    if (!confirm(`Are you sure you want to delete path "${pathId}"?`)) {
      return;
    }

    try {
      await deletePathAPI(pathId);
      toast({
        title: 'Success',
        description: `Path ${pathId} deleted successfully`,
      });
      loadPaths();
      // Trigger a page refresh to update available roots
      window.location.reload();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to delete path',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (path: PathInfo, type: 'system' | 'user') => {
    setSelectedPath({ ...path, type });
    setEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    loadPaths();
    // Trigger a page refresh to update available roots
    window.location.reload();
  };

  const handleEditSuccess = () => {
    loadPaths();
    setEditDialogOpen(false);
    setSelectedPath(null);
    // Trigger a page refresh to update available roots
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Paths Management
            </DialogTitle>
            <DialogDescription>
              Manage system and user paths. Only root and admin users can access this.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Path
              </Button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-muted-foreground">Loading paths...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-6">
                {/* System Paths */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">System Paths</h3>
                  {paths.systemPaths.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 border rounded-lg">
                      <p>No system paths</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg divide-y">
                      {paths.systemPaths.map((path) => {
                        const pathExists = path.exists !== false; // Default to true if not specified
                        return (
                          <div
                            key={path.id}
                            className={`flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${
                              !pathExists ? 'bg-destructive/10' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <div className={`font-bold text-lg ${!pathExists ? 'text-destructive' : ''}`}>
                                {path.name}
                              </div>
                              <div className={`text-sm mt-1 ${!pathExists ? 'text-destructive font-mono' : 'text-muted-foreground'}`}>
                                {path.path}
                              </div>
                              {!pathExists && (
                                <div className="text-xs text-destructive mt-1 font-semibold">
                                  Path isn't found
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(path, 'system')}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(path.id, 'system')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* User Paths */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">User Paths</h3>
                  {paths.userPaths.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 border rounded-lg">
                      <p>No user paths</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg divide-y">
                      {paths.userPaths.map((path) => {
                        const pathExists = path.exists !== false; // Default to true if not specified
                        return (
                          <div
                            key={path.id}
                            className={`flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${
                              !pathExists ? 'bg-destructive/10' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <div className={`font-bold text-lg ${!pathExists ? 'text-destructive' : ''}`}>
                                {path.name}
                              </div>
                              <div className={`text-sm mt-1 ${!pathExists ? 'text-destructive font-mono' : 'text-muted-foreground'}`}>
                                {path.path}
                              </div>
                              {!pathExists && (
                                <div className="text-xs text-destructive mt-1 font-semibold">
                                  Path isn't found
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(path, 'user')}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(path.id, 'user')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddPathDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      <EditPathDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedPath(null);
        }}
        path={selectedPath}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
