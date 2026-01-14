import { format, formatDistanceToNow } from 'date-fns';

export function formatFileSize(bytes: number): string {
  // Handle invalid or zero values
  if (!bytes || bytes === 0 || isNaN(bytes) || !isFinite(bytes)) {
    return '—';
  }
  
  const KB = 1024;
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;
  
  // If less than 1MB, show in KB
  if (bytes < MB) {
    return `${(bytes / KB).toFixed(2)} KB`;
  }
  
  // If less than 1GB, show in MB
  if (bytes < GB) {
    return `${(bytes / MB).toFixed(2)} MB`;
  }
  
  // If 1GB or more, show in GB
  return `${(bytes / GB).toFixed(2)} GB`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getFileExtension(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return null;
}

export function getFileType(extension: string | null, isDirectory: boolean): string {
  if (isDirectory) return 'Folder';
  if (!extension) return 'File';
  
  const types: Record<string, string> = {
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    txt: 'Text File',
    md: 'Markdown',
    json: 'JSON File',
    xml: 'XML File',
    csv: 'CSV File',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    png: 'PNG Image',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    gif: 'GIF Image',
    webp: 'WebP Image',
    svg: 'SVG Image',
    mp3: 'MP3 Audio',
    mp4: 'MP4 Video',
    zip: 'ZIP Archive',
    tar: 'TAR Archive',
    gz: 'GZ Archive',
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    css: 'CSS Stylesheet',
    html: 'HTML Document',
    py: 'Python Script',
    rb: 'Ruby Script',
    go: 'Go Source',
    rs: 'Rust Source',
    example: 'Example File',
    env: 'Environment File',
  };
  
  return types[extension] || `${extension.toUpperCase()} File`;
}
