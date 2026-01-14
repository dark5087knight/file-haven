import { useState, useEffect } from 'react';
import { Users, MoreVertical, Plus, Trash2, Edit } from 'lucide-react';
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
import { UserInfo, fetchUsers, deleteUser as deleteUserAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { AddUserDialog } from './AddUserDialog';
import { EditUserDialog } from './EditUserDialog';

interface UsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersDialog({ open, onOpenChange }: UsersDialogProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await deleteUserAPI(username);
      toast({
        title: 'Success',
        description: `User ${username} deleted successfully`,
      });
      loadUsers();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: UserInfo) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    loadUsers();
  };

  const handleEditSuccess = () => {
    loadUsers();
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </DialogTitle>
            <DialogDescription>
              Manage users and their roles. Only root users can access this.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-muted-foreground">Loading users...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto border rounded-lg">
                <div className="divide-y">
                  {users.map((user) => (
                    <div
                      key={user.username}
                      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Role: <span className="font-medium">{user.role}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.username)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
