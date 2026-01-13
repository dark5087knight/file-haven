export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  created: string;
  extension: string | null;
  permissions: string;
  itemCount?: number;
}

export interface DirectoryListing {
  path: string;
  items: FileItem[];
  total: number;
}

export interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  isExpanded?: boolean;
}

export interface FilePreview {
  path: string;
  type: 'text' | 'json' | 'image' | 'unsupported';
  content?: string;
  mimeType?: string;
  size: number;
}

export interface FileProperties {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  created: string;
  modified: string;
  permissions: string;
  extension: string | null;
  itemCount?: number;
}

export type SortField = 'name' | 'size' | 'modified';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
