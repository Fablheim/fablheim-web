import { useState } from 'react';
import { X, Save, Star, Trash2, Play, Loader2 } from 'lucide-react';
import { useTabs } from '@/context/TabContext';
import { useLayouts, useCreateLayout, useUpdateLayout, useDeleteLayout, useLoadLayout } from '@/hooks/useLayouts';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import type { Layout } from '@/types/layout';

interface LayoutManagerProps {
  open: boolean;
  onClose: () => void;
}

export function LayoutManager({ open, onClose }: LayoutManagerProps) {
  const { captureLayout, restoreLayout } = useTabs();
  const { data: layouts, isLoading } = useLayouts();
  const createLayout = useCreateLayout();
  const updateLayout = useUpdateLayout();
  const deleteLayout = useDeleteLayout();
  const loadLayout = useLoadLayout();

  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  if (!open) return null;

  function handleSave() {
    if (!saveName.trim()) return;

    const snapshot = captureLayout();
    createLayout.mutate(
      { ...snapshot, name: saveName.trim(), description: saveDescription.trim() || undefined },
      {
        onSuccess: () => {
          setSaveName('');
          setSaveDescription('');
          setShowSaveForm(false);
        },
      },
    );
  }

  function handleLoad(layout: Layout) {
    loadLayout.mutate(layout._id, {
      onSuccess: (loaded) => {
        restoreLayout(loaded, resolveRouteContent);
        onClose();
      },
    });
  }

  function handleSetDefault(layout: Layout) {
    updateLayout.mutate({
      id: layout._id,
      payload: { isDefault: !layout.isDefault },
    });
  }

  function handleDelete(layout: Layout) {
    deleteLayout.mutate(layout._id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border border-t-2 border-t-primary/40 bg-card shadow-warm-lg tavern-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Saved Layouts</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Save Current */}
          {!showSaveForm ? (
            <Button
              onClick={() => setShowSaveForm(true)}
              className="mb-4 w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Current Layout
            </Button>
          ) : (
            <div className="mb-4 space-y-3 rounded-md border border-border bg-background p-4">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Layout name"
                maxLength={100}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
              <input
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Description (optional)"
                maxLength={500}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!saveName.trim() || createLayout.isPending}
                  className="flex-1"
                >
                  {createLayout.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowSaveForm(false);
                    setSaveName('');
                    setSaveDescription('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Layouts List */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {layouts && layouts.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No saved layouts yet. Save your current workspace to get started.
            </p>
          )}

          {layouts && layouts.length > 0 && (
            <div className="space-y-2">
              {layouts.map((layout) => (
                <LayoutCard
                  key={layout._id}
                  layout={layout}
                  onLoad={handleLoad}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                  isLoading={loadLayout.isPending && loadLayout.variables === layout._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LayoutCard({
  layout,
  onLoad,
  onSetDefault,
  onDelete,
  isLoading,
}: {
  layout: Layout;
  onLoad: (layout: Layout) => void;
  onSetDefault: (layout: Layout) => void;
  onDelete: (layout: Layout) => void;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4 tavern-card transition-all duration-200 hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">{layout.name}</h3>
            {layout.isDefault && (
              <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                Default
              </span>
            )}
          </div>
          {layout.description && (
            <p className="mt-1 text-xs text-muted-foreground">{layout.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {layout.leftTabs.length} left tab{layout.leftTabs.length !== 1 ? 's' : ''}
            {layout.rightTabs.length > 0 && (
              <> &middot; {layout.rightTabs.length} right tab{layout.rightTabs.length !== 1 ? 's' : ''}</>
            )}
            {layout.usageCount > 0 && (
              <> &middot; Used {layout.usageCount} time{layout.usageCount !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={() => onLoad(layout)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          Load
        </button>
        <button
          onClick={() => onSetDefault(layout)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            layout.isDefault
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title={layout.isDefault ? 'Remove as default' : 'Set as default'}
        >
          <Star className={`h-3 w-3 ${layout.isDefault ? 'fill-current' : ''}`} />
          {layout.isDefault ? 'Default' : 'Set Default'}
        </button>
        <button
          onClick={() => onDelete(layout)}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
