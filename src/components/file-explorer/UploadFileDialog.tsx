import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
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
import { uploadFile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  rootId?: string;
  onSuccess: () => void;
}

export function UploadFileDialog({ open, onOpenChange, currentPath, rootId, onSuccess }: UploadFileDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilename(selectedFile.name);
    }
  };

  // Reset filename when dialog closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setFilename('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!filename || filename.trim() === '') {
      toast({
        title: 'Filename required',
        description: 'Please enter a filename',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await uploadFile(file, currentPath, rootId, filename.trim());
      toast({
        title: 'Success',
        description: `File ${filename.trim()} uploaded successfully`,
      });
      setFile(null);
      setFilename('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to upload file',
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
            <Upload className="h-5 w-5" />
            Upload File
          </DialogTitle>
          <DialogDescription>
            Upload a file to the current directory: {currentPath}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                disabled={loading}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            {file && (
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter filename"
                  disabled={loading}
                />
              </div>
            )}
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
            <Button type="submit" disabled={loading || !file || !filename.trim()}>
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
