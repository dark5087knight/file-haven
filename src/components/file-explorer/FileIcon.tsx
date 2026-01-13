import {
  Folder,
  File,
  FileText,
  FileJson,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

interface FileIconProps {
  extension: string | null;
  isDirectory: boolean;
  className?: string;
}

export function FileIcon({ extension, isDirectory, className = 'h-5 w-5' }: FileIconProps) {
  if (isDirectory) {
    return <Folder className={`${className} text-muted-foreground`} />;
  }

  const ext = extension?.toLowerCase();

  // Text files
  if (['txt', 'md', 'rtf', 'doc', 'docx'].includes(ext || '')) {
    return <FileText className={`${className} text-muted-foreground`} />;
  }

  // JSON/XML
  if (['json', 'xml', 'yaml', 'yml'].includes(ext || '')) {
    return <FileJson className={`${className} text-muted-foreground`} />;
  }

  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext || '')) {
    return <FileImage className={`${className} text-muted-foreground`} />;
  }

  // Video
  if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext || '')) {
    return <FileVideo className={`${className} text-muted-foreground`} />;
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) {
    return <FileAudio className={`${className} text-muted-foreground`} />;
  }

  // Archives
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext || '')) {
    return <FileArchive className={`${className} text-muted-foreground`} />;
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'css', 'scss', 'html'].includes(ext || '')) {
    return <FileCode className={`${className} text-muted-foreground`} />;
  }

  // Spreadsheets
  if (['csv', 'xls', 'xlsx'].includes(ext || '')) {
    return <FileSpreadsheet className={`${className} text-muted-foreground`} />;
  }

  // Config files
  if (['env', 'example', 'config', 'ini'].includes(ext || '')) {
    return <Settings className={`${className} text-muted-foreground`} />;
  }

  return <File className={`${className} text-muted-foreground`} />;
}
