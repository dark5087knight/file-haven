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

// File Upload API
export async function uploadFile(file: File, path: string, rootId?: string, filename?: string): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  if (rootId) {
    formData.append('rootId', rootId);
  }
  if (filename) {
    formData.append('filename', filename);
  }
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  await handleResponse(res);
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

