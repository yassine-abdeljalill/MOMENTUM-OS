export const SCROLL_TO_TOP_THRESHOLD_PX = 200;

/**
 * Determines whether the Header scroll-to-top interaction should be displayed
 * based on the current scroll offset of MainContent's scrollable viewport.
 */
export function shouldShowScrollToTop(
  scrollTop: number,
  threshold: number = SCROLL_TO_TOP_THRESHOLD_PX
): boolean {
  if (!Number.isFinite(scrollTop) || !Number.isFinite(threshold)) {
    return false;
  }
  return scrollTop > threshold;
}
