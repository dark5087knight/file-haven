import { DirectoryListing, FilePreview, TreeNode } from "@/types/files";

export interface RootConfig {
  id: string;
  name: string;
  path: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = (await res.json().catch(() => null))?.error || res.statusText;
    throw new Error(message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  await handleResponse(res);
}

export async function fetchRoots(): Promise<RootConfig[]> {
  const res = await fetch(`/api/roots`, { credentials: 'include' });
  return handleResponse<RootConfig[]>(res);
}

export async function fetchDirectory(path: string, rootId?: string): Promise<DirectoryListing> {
  const params = new URLSearchParams({ path });
  if (rootId) params.set("rootId", rootId);
  const res = await fetch(`/api/list?${params}`, { credentials: 'include' });
  const data = await handleResponse<{ items: DirectoryListing["items"]; total: number }>(res);
  return { path, items: data.items, total: data.total };
}

export async function fetchTree(path: string, rootId?: string): Promise<TreeNode[]> {
  const params = new URLSearchParams({ path });
  if (rootId) params.set("rootId", rootId);
  const res = await fetch(`/api/tree?${params}`, { credentials: 'include' });
  return handleResponse<TreeNode[]>(res);
}

export async function fetchPreview(path: string, rootId?: string): Promise<FilePreview> {
  const params = new URLSearchParams({ path });
  if (rootId) params.set("rootId", rootId);
  const res = await fetch(`/api/preview?${params}`, { credentials: 'include' });
  return handleResponse<FilePreview>(res);
}

export async function deleteItemRemote(path: string, rootId?: string): Promise<void> {
  const params = new URLSearchParams({ path });
  if (rootId) params.set("rootId", rootId);
  const res = await fetch(`/api/item?${params}`, { method: "DELETE", credentials: 'include' });
  await handleResponse(res);
}

export async function downloadFile(path: string, rootId?: string): Promise<void> {
  const params = new URLSearchParams({ path });
  if (rootId) params.set("rootId", rootId);
  const url = `/api/download?${params}`;
  
  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = url;
  // Extract filename from path
  const filename = path.split('/').pop() || 'download';
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// User Management API
export interface UserInfo {
  username: string;
  role: string;
}

export interface UserCreate {
  username: string;
  password: string;
  role: string;
}

export interface UserUpdate {
  password?: string;
  role?: string;
}

export async function fetchUsers(): Promise<UserInfo[]> {
  const res = await fetch('/api/users', { credentials: 'include' });
  return handleResponse<UserInfo[]>(res);
}

export async function fetchUser(username: string): Promise<UserInfo> {
  const res = await fetch(`/api/users/${username}`, { credentials: 'include' });
  return handleResponse<UserInfo>(res);
}

export async function createUser(user: UserCreate): Promise<void> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(user),
  });
  await handleResponse(res);
}

export async function updateUser(username: string, updates: UserUpdate): Promise<void> {
  const res = await fetch(`/api/users/${username}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
}

export async function deleteUser(username: string): Promise<void> {
  const res = await fetch(`/api/users/${username}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse(res);
}

// Paths Management API
export interface PathInfo {
  id: string;
  name: string;
  path: string;
  exists?: boolean;
}

export interface PathsList {
  systemPaths: PathInfo[];
  userPaths: PathInfo[];
}

export interface PathCreate {
  type: 'system' | 'user';
  id: string;
  name?: string;
  path: string;
}

export interface PathUpdate {
  name?: string;
  path?: string;
  type?: 'system' | 'user';
}

export async function fetchPaths(): Promise<PathsList> {
  const res = await fetch('/api/paths', { credentials: 'include' });
  return handleResponse<PathsList>(res);
}

export async function createPath(path: PathCreate): Promise<void> {
  const res = await fetch('/api/paths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(path),
  });
  await handleResponse(res);
}

export async function updatePath(id: string, updates: PathUpdate): Promise<void> {
  const res = await fetch(`/api/paths/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
}

export async function deletePath(id: string): Promise<void> {
  const res = await fetch(`/api/paths/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse(res);
}

// File Upload API with progress tracking
export interface UploadProgress {
  loaded: number; // bytes uploaded
  total: number; // total bytes
  percentage: number; // 0-100
  speed: number; // MB/s
}

export interface UploadResponse {
  success: boolean;
  message: string;
  tempFilePath: string;
  targetPath: string;
  filename: string;
}

export function uploadFile(
  file: File,
  path: string,
  rootId: string | undefined,
  filename: string | undefined,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    if (rootId) {
      formData.append('rootId', rootId);
    }
    if (filename) {
      formData.append('filename', filename);
    }

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000; // seconds
        const loadedDiff = e.loaded - lastLoaded; // bytes
        
        // Calculate speed in MB/s
        let speed = 0;
        if (timeDiff > 0) {
          speed = (loadedDiff / (1024 * 1024)) / timeDiff; // MB/s
        }

        const progress: UploadProgress = {
          loaded: e.loaded,
          total: e.total,
          percentage: (e.loaded / e.total) * 100,
          speed: speed,
        };

        onProgress(progress);
        lastLoaded = e.loaded;
        lastTime = currentTime;
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          // Validate response has required fields
          if (response && response.tempFilePath && response.targetPath) {
            resolve(response as UploadResponse);
          } else {
            reject(new Error('Invalid response from server: missing required fields'));
          }
        } catch (err) {
          reject(new Error('Failed to parse server response'));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', '/api/upload');
    xhr.withCredentials = true; // Include credentials
    xhr.send(formData);
  });
}

// Directory Creation API
export async function createDirectory(path: string, name: string, rootId?: string): Promise<void> {
  const res = await fetch('/api/directory', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, rootId, name }),
  });
  await handleResponse(res);
}

// Move uploaded file from temp to final location with progress tracking
export function moveUploadedFile(
  tempFilePath: string,
  targetPath: string,
  fileSize: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastTime = Date.now();
    let lastLoaded = 0;
    let currentProgress = 0;
    
    // Simulate progress for move operation
    // Since we can't easily track actual server-side copy progress, we estimate based on time
    const startTime = Date.now();
    const estimatedDuration = Math.max(1000, fileSize / (10 * 1024 * 1024) * 1000); // Estimate based on 10MB/s
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      currentProgress = Math.min(95, (elapsed / estimatedDuration) * 100);
      
      if (onProgress) {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const loaded = (fileSize * currentProgress) / 100;
        const loadedDiff = loaded - lastLoaded;
        const speed = timeDiff > 0 ? (loadedDiff / (1024 * 1024)) / timeDiff : 0;
        
        onProgress({
          loaded: loaded,
          total: fileSize,
          percentage: currentProgress,
          speed: speed,
        });
        
        lastTime = now;
        lastLoaded = loaded;
      }
    }, 100); // Update every 100ms
    
    xhr.addEventListener('load', () => {
      clearInterval(progressInterval);
      
      // Set to 100% on completion
      if (onProgress) {
        onProgress({
          loaded: fileSize,
          total: fileSize,
          percentage: 100,
          speed: 0,
        });
      }
      
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error || 'Move failed'));
        } catch {
          reject(new Error('Move failed'));
        }
      }
    });
    
    xhr.addEventListener('error', () => {
      clearInterval(progressInterval);
      reject(new Error('Network error during move'));
    });
    
    xhr.addEventListener('abort', () => {
      clearInterval(progressInterval);
      reject(new Error('Move cancelled'));
    });
    
    xhr.open('POST', '/api/upload/move');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;
    xhr.send(JSON.stringify({ tempFilePath, targetPath }));
  });
}

