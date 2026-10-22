import { useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Lightbox({ images = [], index = 0, onClose, onChange }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') onChange?.(Math.max(0, index - 1));
      if (e.key === 'ArrowRight') onChange?.(Math.min(images.length - 1, index + 1));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onClose, onChange]);

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-lg bg-black/60 p-3 text-white hover:bg-black/80" aria-label="Close">
        <FiX className="h-5 w-5" />
      </button>
      {index > 0 && (
        <button onClick={() => onChange?.(index - 1)} className="absolute left-4 rounded-lg bg-black/60 p-3 text-white hover:bg-black/80" aria-label="Previous">
          <FiChevronLeft className="h-6 w-6" />
        </button>
      )}
      <img src={images[index]} alt="" className="max-h-[90vh] max-w-[90vw] rounded-premium object-contain" />
      {index < images.length - 1 && (
        <button onClick={() => onChange?.(index + 1)} className="absolute right-4 rounded-lg bg-black/60 p-3 text-white hover:bg-black/80" aria-label="Next">
          <FiChevronRight className="h-6 w-6" />
        </button>
      )}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}
