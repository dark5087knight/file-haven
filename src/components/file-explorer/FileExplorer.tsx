import { useState, useEffect, useCallback } from 'react';
import { useFileExplorer } from '@/hooks/use-file-explorer';
import { DirectoryTree } from './DirectoryTree';
import { Breadcrumbs } from './Breadcrumbs';
import { Toolbar } from './Toolbar';
import { FileList } from './FileList';
import { PreviewPanel } from './PreviewPanel';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { PropertiesDrawer } from './PropertiesDrawer';
import { FileItem, FileProperties } from '@/types/files';
import { getMockProperties } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { HardDrive } from 'lucide-react';

export function FileExplorer() {
  const {
    currentPath,
    items,
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
  } = useFileExplorer();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [properties, setProperties] = useState<FileProperties | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  // Load initial directory
  useEffect(() => {
    loadDirectory('/');
  }, [loadDirectory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case 'Backspace':
          if (currentPath !== '/') {
            navigateUp();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (items.length > 0) {
            const currentIndex = selectedItem
              ? items.findIndex(i => i.path === selectedItem.path)
              : -1;
            const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            setSelectedItem(items[newIndex]);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (items.length > 0) {
            const currentIndex = selectedItem
              ? items.findIndex(i => i.path === selectedItem.path)
              : -1;
            const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            setSelectedItem(items[newIndex]);
          }
          break;
        case 'Enter':
          if (selectedItem?.isDirectory) {
            navigateTo(selectedItem.path);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPath, items, selectedItem, navigateUp, navigateTo, setSelectedItem]);

  const handleDownload = useCallback((item: FileItem) => {
    // In a real app, this would trigger a download
    toast({
      title: 'Download started',
      description: `Downloading ${item.name}...`,
    });
  }, []);

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
    const props = getMockProperties(item.path);
    setProperties(props);
    setPropertiesOpen(true);
  }, []);

  const handleSelectItem = useCallback((item: FileItem) => {
    setSelectedItem(item);
    setPreviewItem(item);
  }, [setSelectedItem]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <HardDrive className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-lg font-semibold">File Manager</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border bg-sidebar overflow-auto hidden md:block">
          <DirectoryTree currentPath={currentPath} onNavigate={navigateTo} />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumbs items={breadcrumbs} onNavigate={navigateTo} />
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
            selectedItem={selectedItem}
            sortConfig={sortConfig}
            onSort={sortItems}
            onSelectItem={handleSelectItem}
            onOpenDirectory={navigateTo}
            onDownload={handleDownload}
            onDelete={handleDeleteRequest}
            onProperties={handleProperties}
          />
        </main>

        {/* Preview panel */}
        {previewItem && (
          <PreviewPanel
            item={previewItem}
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
    </div>
  );
}
