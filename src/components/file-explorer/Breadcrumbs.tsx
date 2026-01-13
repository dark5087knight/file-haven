import { ChevronRight, Copy, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  const currentPath = items[items.length - 1]?.path || '/';

  const copyPath = () => {
    navigator.clipboard.writeText(currentPath);
    toast({
      title: 'Copied',
      description: 'Path copied to clipboard',
    });
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card">
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
        {items.map((item, index) => (
          <div key={item.path} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <button
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors hover:bg-accent ${
                index === items.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {index === 0 && <Home className="h-4 w-4" />}
              <span>{item.name}</span>
            </button>
          </div>
        ))}
      </nav>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={copyPath}
        title="Copy path"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
