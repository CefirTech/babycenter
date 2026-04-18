import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  bucket: 'product-images' | 'category-images' | 'avatars';
  /** Sous-dossier dans le bucket (ex: user_id pour avatars) */
  folder?: string;
  /** URLs actuelles */
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxSizeMB?: number;
  /** Pour avatar: 'square' rond */
  shape?: 'square' | 'round';
}

export default function ImageUploader({ bucket, folder, value, onChange, multiple = true, maxSizeMB = 5, shape = 'square' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList) => {
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name}: dépasse ${maxSizeMB}MB`);
          continue;
        }
        const ext = file.name.split('.').pop() || 'jpg';
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = folder ? `${folder}/${name}` : name;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
        if (error) { toast.error(error.message); continue; }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length) {
        onChange(multiple ? [...value, ...uploaded] : uploaded.slice(-1));
        toast.success(`${uploaded.length} image(s) téléversée(s)`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const addUrl = () => {
    if (!urlInput) return;
    onChange(multiple ? [...value, urlInput] : [urlInput]);
    setUrlInput('');
  };

  const sizeCls = shape === 'round' ? 'w-20 h-20 rounded-full' : 'w-20 h-20 rounded-lg';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={e => e.target.files && upload(e.target.files)} />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? 'Téléversement…' : 'Téléverser'}
        </Button>
        <div className="flex gap-1 flex-1 min-w-[200px]">
          <Input placeholder="ou coller une URL https://..." value={urlInput} onChange={e => setUrlInput(e.target.value)} className="text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={addUrl} title="Ajouter URL"><LinkIcon className="h-4 w-4" /></Button>
        </div>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((u, i) => (
            <div key={i} className="relative group">
              <img src={u} alt="" className={`${sizeCls} object-cover border border-border bg-muted`} />
              <button type="button" onClick={() => removeAt(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP — max {maxSizeMB}MB par image</p>
    </div>
  );
}
