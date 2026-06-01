import { useEffect, useRef } from 'preact/hooks';
import { gsap, ScrollTrigger } from '../lib/gsap';

export function useScrollReveal(options?: { y?: number; delay?: number }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        y: options?.y ?? 40,
        autoAlpha: 0,
        duration: 0.8,
        delay: options?.delay ?? 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current!,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return ref;
}
