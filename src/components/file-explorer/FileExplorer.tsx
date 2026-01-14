import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFileExplorer } from '@/hooks/use-file-explorer';
import { DirectoryTree } from './DirectoryTree';
import { PathsTree } from './PathsTree';
import { Breadcrumbs } from './Breadcrumbs';
import { Toolbar } from './Toolbar';
import { FileList } from './FileList';
import { PreviewPanel } from './PreviewPanel';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { PropertiesDrawer } from './PropertiesDrawer';
import { UsersDialog } from './UsersDialog';
import { PathsDialog } from './PathsDialog';
import { FileItem, FileProperties } from '@/types/files';
import { toast } from '@/hooks/use-toast';
import { downloadFile, logout, fetchRoots } from '@/lib/api';
import { HardDrive, LogOut, Users, FolderTree, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthContext } from '@/App';

export function FileExplorer() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const isRoot = auth.role === 'root';
  const isAdmin = auth.role === 'admin' || auth.role === 'root';
  const {
    currentPath,
    currentRootId,
    availableRoots,
    items,
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
  } = useFileExplorer();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [properties, setProperties] = useState<FileProperties | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [pathsDialogOpen, setPathsDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pathsRefreshTrigger, setPathsRefreshTrigger] = useState(0);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      // Clear localStorage
      localStorage.removeItem('fileExplorer_currentPath');
      localStorage.removeItem('fileExplorer_currentRootId');
      navigate('/login');
    } catch (err) {
      toast({
        title: 'Logout failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
      setLogoutLoading(false);
    }
  }, [navigate]);

  // Load initial directory when root is ready
  useEffect(() => {
    if (currentRootId) {
      // Backend will handle protection - non-root users will get 403 if they try to access "/"
      loadDirectory(currentPath, currentRootId);
    }
  }, [currentRootId, loadDirectory, currentPath]);

  // Keyboard navigation (focus on first selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return;
      const focused = selectedItems[0] ?? null;

      switch (e.key) {
        case 'Backspace':
          if (currentPath !== '/') {
            navigateUp();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (items.length > 0) {
            const currentIndex = focused
              ? items.findIndex(i => i.path === focused.path)
              : -1;
            const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            selectItem(items[newIndex], 'single');
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (items.length > 0) {
            const currentIndex = focused
              ? items.findIndex(i => i.path === focused.path)
              : -1;
            const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            selectItem(items[newIndex], 'single');
          }
          break;
        case 'Enter':
          if (focused?.isDirectory) {
            navigateTo(focused.path);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPath, items, selectedItems, navigateUp, navigateTo, selectItem]);

  const handleDownload = useCallback((item: FileItem) => {
    if (item.isDirectory) {
      toast({
        title: 'Cannot download',
        description: 'Directories cannot be downloaded',
        variant: 'destructive',
      });
      return;
    }
    try {
      downloadFile(item.path, currentRootId);
      toast({
        title: 'Download started',
        description: `Downloading ${item.name}...`,
      });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: (err as Error).message || 'Failed to download file',
        variant: 'destructive',
      });
    }
  }, [currentRootId]);

  const handleDeleteRequest = useCallback((item: FileItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      if (previewItem?.path === itemToDelete.path) {
        setPreviewItem(null);
      }
    }
  }, [itemToDelete, deleteItem, previewItem]);

  const handleProperties = useCallback((item: FileItem) => {
    const props: FileProperties = {
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
    setProperties(props);
    setPropertiesOpen(true);
  }, []);

  const handleSelectItem = useCallback((item: FileItem, mode: 'single' | 'toggle' | 'range') => {
    selectItem(item, mode);
    setPreviewItem(item);
  }, [selectItem]);

  const handleNavigateTo = useCallback((path: string) => {
    // Prevent non-root users from accessing "/" path only in system roots
    // Regular users can access "/" in their user paths
    if (path === '/' && !isRoot) {
      // Check if current root is a user path - if so, allow access
      const currentRoot = availableRoots.find(r => r.id === currentRootId);
      // If the user has access to this root and it's not the system root, allow it
      // (user paths are already filtered by the API, so if it's in availableRoots, it's allowed)
      if (!currentRoot || currentRootId === 'root') {
        toast({
          title: 'Access Denied',
          description: 'Root access required to view root path',
          variant: 'destructive',
        });
        return;
      }
      // It's a user path, so allow access to "/"
    }
    navigateTo(path);
  }, [navigateTo, isRoot, currentRootId, availableRoots]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <HardDrive className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-lg font-semibold">File Manager</h1>
        {availableRoots.length > 1 && (
          <Select value={currentRootId || ''} onValueChange={switchRoot}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select root" />
            </SelectTrigger>
            <SelectContent>
              {availableRoots.map((root) => (
                <SelectItem key={root.id} value={root.id}>
                  {root.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto" />
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPathsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <FolderTree className="h-4 w-4" />
            Paths
          </Button>
        )}
        {isRoot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUsersDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex items-center gap-2"
        >
          {logoutLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Logout
            </>
          )}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border bg-sidebar overflow-auto hidden md:block flex flex-col">
          <div className="border-b border-border p-2">
            <PathsTree 
              currentRootId={currentRootId} 
              onSwitchRoot={switchRoot}
              refreshTrigger={pathsRefreshTrigger}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <DirectoryTree currentPath={currentPath} rootId={currentRootId} onNavigate={handleNavigateTo} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumbs 
            items={breadcrumbs} 
            onNavigate={handleNavigateTo} 
            currentPath={currentPath}
            rootId={currentRootId}
            onUploadSuccess={refresh}
          />
          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={refresh}
            onNavigateUp={navigateUp}
            canNavigateUp={currentPath !== '/'}
          />
          <FileList
            items={items}
            loading={loading}
            selectedItems={selectedItems}
            sortConfig={sortConfig}
            onSort={sortItems}
            onSelectItem={handleSelectItem}
            onOpenDirectory={handleNavigateTo}
            onDownload={handleDownload}
            onDelete={handleDeleteRequest}
            onProperties={handleProperties}
            isRoot={isRoot}
          />
        </main>

        {/* Preview panel */}
        {previewItem && (
          <PreviewPanel
            item={previewItem}
            rootId={currentRootId}
            onClose={() => setPreviewItem(null)}
            onDownload={() => handleDownload(previewItem)}
          />
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmDialog
        item={itemToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />

      <PropertiesDrawer
        properties={properties}
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
      />

      <UsersDialog
        open={usersDialogOpen}
        onOpenChange={setUsersDialogOpen}
      />

      <PathsDialog
        open={pathsDialogOpen}
        onOpenChange={(open) => {
          setPathsDialogOpen(open);
          if (!open) {
            // Refresh paths when dialog closes (paths might have been edited)
            setPathsRefreshTrigger(prev => prev + 1);
          }
        }}
      />
    </div>
  );
}
