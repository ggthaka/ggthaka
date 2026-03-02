'use client';

import { useEffect, useState } from 'react';
import { getScrollContainer, type ScrollContainer } from './scrollContainer';

interface Props {
  targetSelector?: string;
  className?: string;
  barClassName?: string;
}

export default function BlogReadingProgress({
  targetSelector = '.markdown-body',
  className,
  barClassName,
}: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const isWindow = (container: ScrollContainer): container is Window =>
      container === window;

    const getTarget = () =>
      (document.querySelector(targetSelector) as HTMLElement | null) ?? null;

    const getScrollTop = (container: ScrollContainer) =>
      isWindow(container) ? window.scrollY : container.scrollTop;

    const getViewportHeight = (container: ScrollContainer) =>
      isWindow(container) ? window.innerHeight : container.clientHeight;

    const getTargetTop = (target: HTMLElement, container: ScrollContainer) => {
      if (isWindow(container)) {
        const rect = target.getBoundingClientRect();
        return rect.top + window.scrollY;
      }

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return targetRect.top - containerRect.top + container.scrollTop;
    };

    const update = () => {
      const target = getTarget();
      if (!target) {
        setProgress(0);
        return;
      }

      const container = getScrollContainer(target);
      const top = getTargetTop(target, container);
      const height = target.offsetHeight;
      const viewport = getViewportHeight(container);
      const scrollTop = getScrollTop(container);

      const max = Math.max(1, height - viewport);
      const raw = (scrollTop - top) / max;
      const next = Math.max(0, Math.min(1, raw));

      setProgress(next);
    };

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    const attach = () => {
      const target = getTarget();
      if (!target) return { detach: () => {} };

      const container = getScrollContainer(target);

      if (container === window) {
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
      } else {
        container.addEventListener('scroll', scheduleUpdate, {
          passive: true,
        });
      }

      window.addEventListener('resize', scheduleUpdate);

      const resizeObserver =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(scheduleUpdate)
          : null;

      resizeObserver?.observe(target);
      if (!isWindow(container)) resizeObserver?.observe(container);

      return {
        detach: () => {
          if (container === window) {
            window.removeEventListener('scroll', scheduleUpdate);
          } else {
            container.removeEventListener('scroll', scheduleUpdate);
          }

          window.removeEventListener('resize', scheduleUpdate);
          resizeObserver?.disconnect();
          if (raf) window.cancelAnimationFrame(raf);
        },
      };
    };

    update();
    const { detach } = attach();

    return detach;
  }, [targetSelector]);

  return (
    <div
      className={className}
      aria-hidden='true'
    >
      <div
        className={barClassName}
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
