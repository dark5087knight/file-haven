import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uploadFile, moveUploadedFile, UploadProgress, UploadResponse } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatFileSize } from '@/lib/format';

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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [moveProgress, setMoveProgress] = useState<UploadProgress | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'upload' | 'move' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setFilename(selectedFile.name);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      toast({
        title: 'Error',
        description: 'Failed to select file',
        variant: 'destructive',
      });
    }
  };

  // Reset filename when dialog closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setFilename('');
      setUploadProgress(null);
      setMoveProgress(null);
      setUploadPhase(null);
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
    const fileSize = file?.size || 0;
    setUploadProgress({ loaded: 0, total: fileSize, percentage: 0, speed: 0 });
    setUploadPhase('upload');
    
    try {
      // Step 1: Upload to temp location
      const uploadResponse: UploadResponse = await uploadFile(
        file,
        currentPath,
        rootId,
        filename.trim(),
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Validate upload response
      if (!uploadResponse || !uploadResponse.tempFilePath || !uploadResponse.targetPath) {
        throw new Error('Invalid response from server: missing file information');
      }
      
      // Step 2: Move from temp to final location
      setUploadPhase('move');
      const fileSize = file?.size || 0;
      setMoveProgress({ loaded: 0, total: fileSize, percentage: 0, speed: 0 });
      
      await moveUploadedFile(
        uploadResponse.tempFilePath,
        uploadResponse.targetPath,
        fileSize,
        (progress) => {
          setMoveProgress(progress);
        }
      );
      
      toast({
        title: 'Success',
        description: `File ${filename.trim()} uploaded successfully`,
      });
      setFile(null);
      setFilename('');
      setUploadProgress(null);
      setMoveProgress(null);
      setUploadPhase(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setUploadProgress(null);
      setMoveProgress(null);
      setUploadPhase(null);
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
                  Selected: {file.name} ({formatFileSize(file?.size || 0)})
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
            {uploadProgress && uploadPhase === 'upload' && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground mb-1">Uploading to server...</div>
                <Progress value={uploadProgress.percentage} className="h-2" />
                <div className="text-center text-sm text-muted-foreground">
                  {uploadProgress.speed > 0 ? `${uploadProgress.speed.toFixed(2)} MB/s` : 'Calculating...'}
                </div>
              </div>
            )}
            {moveProgress && uploadPhase === 'move' && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground mb-1">Moving to final location...</div>
                <Progress value={moveProgress.percentage} className="h-2" />
                <div className="text-center text-sm text-muted-foreground">
                  {moveProgress.speed > 0 ? `${moveProgress.speed.toFixed(2)} MB/s` : 'Calculating...'}
                </div>
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

