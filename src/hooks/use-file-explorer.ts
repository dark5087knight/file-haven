import { useState, useCallback, useMemo, useEffect } from 'react';
import { FileItem, SortConfig, SortField, SortDirection } from '@/types/files';
import { toast } from '@/hooks/use-toast';
import { deleteItemRemote, fetchDirectory, fetchRoots, RootConfig } from '@/lib/api';

const STORAGE_KEY_PATH = 'fileExplorer_currentPath';
const STORAGE_KEY_ROOT = 'fileExplorer_currentRootId';

export function useFileExplorer() {
  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PATH) || '/' : '/';
  });
  const [currentRootId, setCurrentRootId] = useState<string | undefined>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ROOT) || undefined : undefined;
  });
  const [availableRoots, setAvailableRoots] = useState<RootConfig[]>([]);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
  const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);

  // Persist current path to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PATH, currentPath);
  }, [currentPath]);

  // Persist current root to localStorage
  useEffect(() => {
    if (currentRootId) {
      localStorage.setItem(STORAGE_KEY_ROOT, currentRootId);
    }
  }, [currentRootId]);

  // Load available roots on mount and reload periodically to catch path changes
  useEffect(() => {
    const loadRoots = () => {
      fetchRoots().then(setAvailableRoots).catch(() => {
        // Fallback if API fails
        setAvailableRoots([{ id: 'default', name: 'Root', path: '/' }]);
      });
    };
    
    loadRoots();
    
    // Reload roots every 5 seconds to catch path existence changes
    const interval = setInterval(loadRoots, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Set first root as default when roots are loaded, and validate current root exists
  useEffect(() => {
    if (availableRoots.length > 0) {
      // Check if current root still exists in available roots
      if (currentRootId && !availableRoots.some(r => r.id === currentRootId)) {
        // Current root doesn't exist anymore, switch to first available
        const firstRoot = availableRoots[0].id;
        setCurrentRootId(firstRoot);
        setCurrentPath('/');
        return;
      }
      
      // If no current root is set, use saved one or first available
      if (!currentRootId) {
        const savedRootId = localStorage.getItem(STORAGE_KEY_ROOT);
        const rootToUse = savedRootId && availableRoots.some(r => r.id === savedRootId) 
          ? savedRootId 
          : availableRoots[0].id;
        setCurrentRootId(rootToUse);
      }
    }
  }, [availableRoots, currentRootId]);

  const loadDirectory = useCallback(async (path: string, rootId?: string) => {
    setLoading(true);
    try {
      const { items: fetched } = await fetchDirectory(path, rootId || currentRootId);
      setItems(fetched);
      setCurrentPath(path);
      setSearchQuery('');
      setSelectedItems([]);
      setLastSelectedPath(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to load directory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentRootId]);

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
    try {
      await deleteItemRemote(item.path, currentRootId);
      setItems(prev => prev.filter(i => i.path !== item.path));
      setSelectedItems(prev => prev.filter(i => i.path !== item.path));
      toast({
        title: 'Deleted',
        description: `${item.name} has been deleted`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to delete item',
        variant: 'destructive',
      });
    }
  }, [currentRootId]);

  const switchRoot = useCallback((rootId: string) => {
    setCurrentRootId(rootId);
    setCurrentPath('/');
    loadDirectory('/', rootId);
  }, [loadDirectory]);

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

  const selectItem = useCallback(
    (item: FileItem, mode: 'single' | 'toggle' | 'range') => {
      const list = sortedAndFilteredItems;

      if (mode === 'single') {
        setSelectedItems([item]);
        setLastSelectedPath(item.path);
        return;
      }

      if (mode === 'toggle') {
        setSelectedItems(prev => {
          const exists = prev.some(i => i.path === item.path);
          const updated = exists ? prev.filter(i => i.path !== item.path) : [...prev, item];
          return updated;
        });
        setLastSelectedPath(item.path);
        return;
      }

      // range
      setLastSelectedPath(item.path);
      setSelectedItems(() => {
        const anchorPath = lastSelectedPath ?? item.path;
        const startIndex = list.findIndex(i => i.path === anchorPath);
        const endIndex = list.findIndex(i => i.path === item.path);
        if (startIndex === -1 || endIndex === -1) {
          return [item];
        }
        const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
        const rangeItems = list.slice(from, to + 1);
        return rangeItems;
      });
    },
    [lastSelectedPath, sortedAndFilteredItems],
  );

  const breadcrumbs = useMemo(() => {
    const currentRoot = availableRoots.find(r => r.id === currentRootId);
    const rootName = currentRoot?.name || 'Root';
    
    if (currentPath === '/') {
      return [{ name: rootName, path: '/' }];
    }
    
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: rootName, path: '/' }];
    
    let accumulatedPath = '';
    for (const part of parts) {
      accumulatedPath += `/${part}`;
      crumbs.push({ name: part, path: accumulatedPath });
    }
    
    return crumbs;
  }, [currentPath, currentRootId, availableRoots]);

  return {
    currentPath,
    currentRootId,
    availableRoots,
    items: sortedAndFilteredItems,
    loading,
    searchQuery,
    setSearchQuery,
    sortConfig,
    sortItems,
    selectedItems,
    selectItem,
    breadcrumbs,
    loadDirectory,
    navigateUp,
    navigateTo,
    refresh,
    deleteItem,
    switchRoot,
  };
}
