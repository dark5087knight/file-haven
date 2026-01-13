import { useState, useCallback, useMemo } from 'react';
import { FileItem, SortConfig, SortField, SortDirection } from '@/types/files';
import { getMockDirectoryListing, deleteMockItem } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';

export function useFileExplorer() {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { items } = getMockDirectoryListing(path);
    setItems(items);
    setCurrentPath(path);
    setSearchQuery('');
    setSelectedItem(null);
    setLoading(false);
  }, []);

  const navigateUp = useCallback(() => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    loadDirectory(parentPath);
  }, [currentPath, loadDirectory]);

  const navigateTo = useCallback((path: string) => {
    loadDirectory(path);
  }, [loadDirectory]);

  const refresh = useCallback(() => {
    loadDirectory(currentPath);
    toast({
      title: 'Refreshed',
      description: 'Directory contents reloaded',
    });
  }, [currentPath, loadDirectory]);

  const deleteItem = useCallback(async (item: FileItem) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const success = deleteMockItem(item.path);
    if (success) {
      setItems(prev => prev.filter(i => i.path !== item.path));
      toast({
        title: 'Deleted',
        description: `${item.name} has been deleted`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  }, []);

  const sortItems = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortedAndFilteredItems = useMemo(() => {
    let result = [...items];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(query));
    }
    
    // Sort items (directories first, then by field)
    result.sort((a, b) => {
      // Always put directories first
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      
      let comparison = 0;
      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [items, searchQuery, sortConfig]);

  const breadcrumbs = useMemo(() => {
    if (currentPath === '/') {
      return [{ name: 'Root', path: '/' }];
    }
    
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'Root', path: '/' }];
    
    let accumulatedPath = '';
    for (const part of parts) {
      accumulatedPath += `/${part}`;
      crumbs.push({ name: part, path: accumulatedPath });
    }
    
    return crumbs;
  }, [currentPath]);

  return {
    currentPath,
    items: sortedAndFilteredItems,
    loading,
    searchQuery,
    setSearchQuery,
    sortConfig,
    sortItems,
    selectedItem,
    setSelectedItem,
    breadcrumbs,
    loadDirectory,
    navigateUp,
    navigateTo,
    refresh,
    deleteItem,
  };
}
