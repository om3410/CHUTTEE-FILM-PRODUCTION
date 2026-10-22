export default function PageHero({ image, eyebrow, title, subtitle, lead, slogan }) {
  return (
    <div className="relative flex min-h-[260px] overflow-hidden rounded-premium border border-zinc-800">
      {image && <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center" />}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/40" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_15%_50%,rgba(212,175,55,0.15),transparent_60%)]" />
      <div className="relative z-10 flex w-full flex-col justify-center px-6 py-12 sm:px-8 lg:px-12">
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">{eyebrow}</p>}
        {title && <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{title}</h1>}
        {subtitle && <h2 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white/90 drop-shadow-lg">{subtitle}</h2>}
        {lead && <p className="mt-4 max-w-4xl text-sm sm:text-base leading-relaxed text-zinc-300">{lead}</p>}
        {slogan && <p className="mt-4 max-w-4xl font-serif italic text-base sm:text-lg text-gold-300">{slogan}</p>}
        <div className="mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
      </div>
    </div>
  );
}
