export default function SkeletonLoader({ className = '', variant = 'line', count = 1 }) {
  const variants = {
    line: 'h-4 w-full',
    title: 'h-6 w-40',
    card: 'h-32 w-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-9 w-24',
  };
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-lg bg-zinc-800/70 ${variants[variant]} ${className}`} />
      ))}
    </>
  );
}