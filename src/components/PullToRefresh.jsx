import React, { useRef, useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [indicatorH, setIndicatorH] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const currentH = useRef(0);
  const isRefreshing = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY === 0 && !isRefreshing.current) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY === 0) {
        const h = Math.min(delta * 0.5, THRESHOLD + 10);
        currentH.current = h;
        setIndicatorH(h);
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      const h = currentH.current;
      currentH.current = 0;

      if (h >= THRESHOLD && !isRefreshing.current) {
        isRefreshing.current = true;
        setRefreshing(true);
        setIndicatorH(0);
        try {
          await onRefresh();
        } finally {
          isRefreshing.current = false;
          setRefreshing(false);
        }
      } else {
        setIndicatorH(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh]);

  return (
    <div>
      {(indicatorH > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150"
          style={{ height: refreshing ? 56 : indicatorH }}
        >
          <RefreshCw
            className={`w-5 h-5 text-[#5FBDBD] ${refreshing ? "animate-spin" : ""}`}
            style={{ opacity: refreshing ? 1 : Math.min(indicatorH / THRESHOLD, 1) }}
          />
        </div>
      )}
      {children}
    </div>
  );
}