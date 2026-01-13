import { FileItem, TreeNode, FilePreview, FileProperties } from '@/types/files';

// Mock filesystem data for frontend preview
const mockFiles: Record<string, FileItem[]> = {
  '/': [
    {
      name: 'documents',
      path: '/documents',
      isDirectory: true,
      size: 0,
      modified: '2025-01-10T14:30:00Z',
      created: '2024-06-15T09:00:00Z',
      extension: null,
      permissions: 'drwxr-xr-x',
      itemCount: 5,
    },
    {
      name: 'images',
      path: '/images',
      isDirectory: true,
      size: 0,
      modified: '2025-01-12T10:15:00Z',
      created: '2024-08-20T11:30:00Z',
      extension: null,
      permissions: 'drwxr-xr-x',
      itemCount: 3,
    },
    {
      name: 'config',
      path: '/config',
      isDirectory: true,
      size: 0,
      modified: '2025-01-08T16:45:00Z',
      created: '2024-05-01T08:00:00Z',
      extension: null,
      permissions: 'drwxr-xr-x',
      itemCount: 2,
    },
    {
      name: 'readme.md',
      path: '/readme.md',
      isDirectory: false,
      size: 2048,
      modified: '2025-01-13T08:00:00Z',
      created: '2024-01-01T12:00:00Z',
      extension: 'md',
      permissions: '-rw-r--r--',
    },
    {
      name: 'package.json',
      path: '/package.json',
      isDirectory: false,
      size: 1256,
      modified: '2025-01-11T19:20:00Z',
      created: '2024-01-01T12:00:00Z',
      extension: 'json',
      permissions: '-rw-r--r--',
    },
  ],
  '/documents': [
    {
      name: 'report-2024.pdf',
      path: '/documents/report-2024.pdf',
      isDirectory: false,
      size: 5242880,
      modified: '2025-01-05T11:00:00Z',
      created: '2024-12-20T14:30:00Z',
      extension: 'pdf',
      permissions: '-rw-r--r--',
    },
    {
      name: 'notes.txt',
      path: '/documents/notes.txt',
      isDirectory: false,
      size: 512,
      modified: '2025-01-09T15:30:00Z',
      created: '2024-11-10T09:00:00Z',
      extension: 'txt',
      permissions: '-rw-r--r--',
    },
    {
      name: 'meeting-minutes.md',
      path: '/documents/meeting-minutes.md',
      isDirectory: false,
      size: 3072,
      modified: '2025-01-12T10:00:00Z',
      created: '2024-10-05T16:00:00Z',
      extension: 'md',
      permissions: '-rw-r--r--',
    },
    {
      name: 'archive',
      path: '/documents/archive',
      isDirectory: true,
      size: 0,
      modified: '2024-12-01T08:00:00Z',
      created: '2024-06-01T12:00:00Z',
      extension: null,
      permissions: 'drwxr-xr-x',
      itemCount: 0,
    },
    {
      name: 'data.csv',
      path: '/documents/data.csv',
      isDirectory: false,
      size: 15360,
      modified: '2025-01-08T14:00:00Z',
      created: '2024-09-15T10:30:00Z',
      extension: 'csv',
      permissions: '-rw-r--r--',
    },
  ],
  '/documents/archive': [],
  '/images': [
    {
      name: 'logo.png',
      path: '/images/logo.png',
      isDirectory: false,
      size: 24576,
      modified: '2024-11-20T16:00:00Z',
      created: '2024-08-20T11:30:00Z',
      extension: 'png',
      permissions: '-rw-r--r--',
    },
    {
      name: 'banner.jpg',
      path: '/images/banner.jpg',
      isDirectory: false,
      size: 102400,
      modified: '2025-01-02T12:00:00Z',
      created: '2024-09-10T14:00:00Z',
      extension: 'jpg',
      permissions: '-rw-r--r--',
    },
    {
      name: 'icon.svg',
      path: '/images/icon.svg',
      isDirectory: false,
      size: 1024,
      modified: '2024-10-15T09:00:00Z',
      created: '2024-08-25T10:00:00Z',
      extension: 'svg',
      permissions: '-rw-r--r--',
    },
  ],
  '/config': [
    {
      name: 'settings.json',
      path: '/config/settings.json',
      isDirectory: false,
      size: 2048,
      modified: '2025-01-06T11:30:00Z',
      created: '2024-05-01T08:00:00Z',
      extension: 'json',
      permissions: '-rw-r--r--',
    },
    {
      name: '.env.example',
      path: '/config/.env.example',
      isDirectory: false,
      size: 256,
      modified: '2024-12-10T15:00:00Z',
      created: '2024-05-01T08:00:00Z',
      extension: 'example',
      permissions: '-rw-r--r--',
    },
  ],
};

const mockFileContents: Record<string, string> = {
  '/readme.md': `# Project Documentation

Welcome to the file manager project.

## Features
- Browse directories
- Preview files
- Download files
- Delete files

## Getting Started
Run \`npm install\` and then \`npm start\`.
`,
  '/package.json': JSON.stringify({
    name: 'file-manager',
    version: '1.0.0',
    description: 'A modern file manager',
    main: 'index.js',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js',
    },
    dependencies: {
      express: '^4.18.0',
    },
  }, null, 2),
  '/documents/notes.txt': `Meeting Notes - January 2025

1. Review Q4 metrics
2. Plan Q1 roadmap
3. Discuss budget allocation
4. Team assignments

Action items:
- Follow up with stakeholders
- Prepare presentation
- Schedule next meeting
`,
  '/config/settings.json': JSON.stringify({
    theme: 'dark',
    language: 'en',
    autoSave: true,
    notifications: {
      email: true,
      push: false,
    },
  }, null, 2),
  '/config/.env.example': `# Environment Configuration
ROOT_DIR=/path/to/files
PORT=3000
AUTH_USER=admin
AUTH_PASS=changeme
READ_ONLY=false
`,
};

export function getMockDirectoryListing(path: string): { items: FileItem[]; total: number } {
  const normalizedPath = path === '' ? '/' : path;
  const items = mockFiles[normalizedPath] || [];
  return { items, total: items.length };
}

export function getMockTree(): TreeNode[] {
  return [
    {
      name: 'Root',
      path: '/',
      children: [
        {
          name: 'documents',
          path: '/documents',
          children: [
            { name: 'archive', path: '/documents/archive' },
          ],
        },
        { name: 'images', path: '/images' },
        { name: 'config', path: '/config' },
      ],
    },
  ];
}

export function getMockPreview(path: string): FilePreview {
  const content = mockFileContents[path];
  const item = Object.values(mockFiles).flat().find(f => f.path === path);
  
  if (!item || item.isDirectory) {
    return { path, type: 'unsupported', size: 0 };
  }

  const ext = item.extension?.toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
    return {
      path,
      type: 'image',
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      size: item.size,
    };
  }
  
  if (ext === 'json' && content) {
    return { path, type: 'json', content, size: item.size };
  }
  
  if (content) {
    return { path, type: 'text', content, size: item.size };
  }
  
  return { path, type: 'unsupported', size: item.size };
}

export function getMockProperties(path: string): FileProperties | null {
  const item = Object.values(mockFiles).flat().find(f => f.path === path);
  if (!item) return null;
  
  return {
    name: item.name,
    path: item.path,
    isDirectory: item.isDirectory,
    size: item.size,
    created: item.created,
    modified: item.modified,
    permissions: item.permissions,
    extension: item.extension,
    itemCount: item.itemCount,
  };
}

export function deleteMockItem(path: string): boolean {
  for (const dir of Object.keys(mockFiles)) {
    const index = mockFiles[dir].findIndex(f => f.path === path);
    if (index !== -1) {
      mockFiles[dir].splice(index, 1);
      return true;
    }
  }
  return false;
}
