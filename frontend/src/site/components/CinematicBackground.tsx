// Fixed, full-bleed looping background video for the main site.
// Drop an mp4 at frontend/public/videos/cinematic.mp4 (optional poster at
// /videos/cinematic-poster.jpg). Falls back gracefully if the file is absent.
// The overlay keeps page text legible.
export function CinematicBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <video
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/cinematic-poster.jpg"
      >
        <source src="/videos/cinematic.mp4" type="video/mp4" />
      </video>
      {/* Darken + slight warm tint so the ember palette still reads. */}
      <div className="absolute inset-0 bg-[#0D0D0D]/80" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(230,48,0,0.15), transparent 60%)',
        }}
      />
    </div>
  );
}
