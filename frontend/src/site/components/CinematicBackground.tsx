// Fixed, full-bleed looping background video for the main site.
// Embeds a YouTube video via iframe (legal per YouTube's embed ToS) with a
// dark overlay on top that also hides YouTube's branding.
// Shorts are 9:16; we oversize the iframe so it covers landscape viewports
// at the cost of cropping top/bottom — the overlay hides the seams.

const YT_VIDEO_ID = 'X8TPgGM8Aok';

const YT_SRC =
  `https://www.youtube.com/embed/${YT_VIDEO_ID}` +
  `?autoplay=1&mute=1&loop=1&playlist=${YT_VIDEO_ID}` +
  `&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&disablekb=1`;

export function CinematicBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0A0A0A]"
      aria-hidden
    >
      <iframe
        src={YT_SRC}
        title=""
        allow="autoplay; encrypted-media; picture-in-picture"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          // Cover the viewport: width = max(100vw, 9/16 of viewport height)
          // and height scaled to keep the Short's 9:16 aspect ratio.
          width: 'max(100vw, calc(100vh * 9 / 16))',
          height: 'max(calc(100vw * 16 / 9), 100vh)',
          border: 0,
        }}
      />
      {/* Dark overlay hides YouTube branding and keeps text readable. */}
      <div className="absolute inset-0 bg-[#0D0D0D]/75" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(230,48,0,0.18), transparent 60%)',
        }}
      />
    </div>
  );
}
