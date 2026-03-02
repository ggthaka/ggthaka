export type ScrollContainer = Window | HTMLElement;

const OVERFLOW_SCROLL_RE = /(auto|scroll|overlay)/;

const isScrollable = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  const canScrollY =
    OVERFLOW_SCROLL_RE.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight + 1;
  const canScrollX =
    OVERFLOW_SCROLL_RE.test(style.overflowX) &&
    element.scrollWidth > element.clientWidth + 1;

  return canScrollY || canScrollX;
};

export const getScrollContainer = (target: HTMLElement): ScrollContainer => {
  let element: HTMLElement | null = target;

  while (element) {
    const parent: HTMLElement | null = element.parentElement;
    if (!parent) break;

    if (isScrollable(parent)) return parent;

    element = parent;
    if (element === document.body || element === document.documentElement) {
      break;
    }
  }

  return window;
};
