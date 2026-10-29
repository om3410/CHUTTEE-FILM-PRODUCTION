import { useRef, useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

export default function DragDropUpload({ onFiles, accept = 'image/*', multiple = true, maxSize = 10 * 1024 * 1024 }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    setError('');
    const list = Array.from(files);
    const tooBig = list.find((f) => f.size > maxSize);
    if (tooBig) { setError(`${tooBig.name} exceeds ${Math.round(maxSize / 1024 / 1024)}MB`); return; }
    onFiles?.(list);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${drag ? 'border-gold-500 bg-gold-500/5' : 'border-zinc-700 hover:border-zinc-600'}`}
      >
        <div className="rounded-full bg-zinc-800 p-3"><FiUpload className="h-5 w-5 text-gold-400" /></div>
        <p className="text-sm font-medium text-zinc-200">Drop files here or click to upload</p>
        <p className="text-xs text-zinc-500">{accept} Â· up to {Math.round(maxSize / 1024 / 1024)}MB</p>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {error && <p className="flex items-center gap-1 text-xs text-red-400"><FiX className="h-3 w-3" /> {error}</p>}
    </div>
  );
}