import { useCallback, useEffect, useRef } from "react";

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold ?? 0.12,
        rootMargin: options.rootMargin ?? "0px 0px -40px 0px"
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}

export function useTilt<T extends HTMLElement = HTMLDivElement>(strength = 9) {
  const ref = useRef<T>(null);

  const onMove = useCallback(
    (event: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength;
      el.style.transform = `perspective(1100px) rotateX(${-y}deg) rotateY(${x}deg) scale3d(1.02,1.02,1.02)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform =
        "perspective(1100px) rotateX(0) rotateY(0) scale3d(1,1,1)";
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.12s ease";
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [onLeave, onMove]);

  return ref;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  speed = 0.25
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const tick = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress =
        (viewportHeight - rect.top) / (viewportHeight + rect.height);
      el.style.transform = `translateY(${(progress - 0.5) * speed * 120}px)`;
    };

    window.addEventListener("scroll", tick, { passive: true });
    tick();
    return () => window.removeEventListener("scroll", tick);
  }, [speed]);

  return ref;
}

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  strength = 0.38
) {
  const ref = useRef<T>(null);

  const onMove = useCallback(
    (event: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.45s cubic-bezier(0.2,0,0,1)";
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [onLeave, onMove]);

  return ref;
}
