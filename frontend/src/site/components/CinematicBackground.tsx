// Fixed, full-bleed looping background video for the main site.

import { useEffect, useRef } from 'react';

const BG_VIDEO = '/assets/20260130_WealthyQuaintPastaCopyThis-eUjgBPQ1me2T3Hcv_source (1).mp4';

export function CinematicBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure muted attribute is set before play (some browsers need this)
    video.muted = true;

    const tryPlay = () => {
      video.play().catch(() => {
        // If autoplay is still blocked, play on first user interaction
        const onClick = () => {
          video.play();
          document.removeEventListener('click', onClick);
          document.removeEventListener('touchstart', onClick);
          document.removeEventListener('scroll', onClick);
        };
        document.addEventListener('click', onClick);
        document.addEventListener('touchstart', onClick);
        document.addEventListener('scroll', onClick);
      });
    };

    tryPlay();
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0A0A0A]"
      aria-hidden
    >
      <video
        ref={videoRef}
        src={BG_VIDEO}
        loop
        muted
        playsInline
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
      />
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
