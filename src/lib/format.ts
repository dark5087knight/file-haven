import { format, formatDistanceToNow } from 'date-fns';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
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
