import { useState, useEffect } from 'react';
import { UserCog } from 'lucide-react';
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
import { updateUser, UserInfo, UserUpdate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserInfo | null;
  onSuccess: () => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setPassword(''); // Don't pre-fill password
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);
    try {
      const updates: UserUpdate = {};
      if (password) updates.password = password;
      if (role !== user.role) updates.role = role;
      
      if (Object.keys(updates).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes were made',
        });
        onOpenChange(false);
        return;
      }

      await updateUser(user.username, updates);
      toast({
        title: 'Success',
        description: `User ${user.username} updated successfully`,
      });
      setPassword('');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit User: {user.username}
          </DialogTitle>
          <DialogDescription>
            Update user password and role. Leave password empty to keep current password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={user.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty to keep current password"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="root">Root</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
