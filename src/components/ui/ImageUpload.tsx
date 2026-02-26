import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  maxSizeMB?: number;
  accept?: string;
  currentImage?: string;
  label?: string;
  compact?: boolean;
}

export function ImageUpload({
  onFileSelect,
  maxSizeMB = 10,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  currentImage,
  label = 'Upload Image',
  compact = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImage || null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);

    const validTypes = accept.split(',').map((t) => t.trim());
    if (!validTypes.some((t) => file.type === t)) {
      setError('Invalid file type');
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large (max ${maxSizeMB}MB)`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    onFileSelect(file);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearPreview() {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (previewUrl) {
    return (
      <div className="space-y-2">
        <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
          {label}
        </label>
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className={`rounded-md border border-border object-cover ${
              compact ? 'h-24 w-24' : 'max-h-48 max-w-full'
            }`}
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-1 text-muted-foreground shadow-sm hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed transition-colors ${
          compact ? 'p-4' : 'p-6'
        } ${
          isDragging
            ? 'border-primary/60 bg-primary/5'
            : 'border-border/60 hover:border-primary/40 hover:bg-accent/20'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-['IM_Fell_English']">
            Drag & drop or click to browse
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Max {maxSizeMB}MB
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
