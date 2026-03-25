import { useEffect, useRef, useState } from "react";

/**
 * Anima um número de 0 até `target` em `duration` ms.
 * Retorna o valor atual formatado como moeda BRL.
 */
export function useAnimatedCurrency(target, duration = 700) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(target);
  const raf = useRef(null);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    prev.current = target;

    if (from === to) return;

    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplay(from + (to - from) * ease);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(display);
}