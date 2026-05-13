"use client";

import { useEffect, useRef, useState } from "react";

/** 스크롤 시 한 번만 나타나는 페이드·살짝 상승 */
export function useLandingReveal(rootMargin = "0px 0px -8% 0px", threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        obs.disconnect();
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, threshold]);

  return { ref, visible };
}
