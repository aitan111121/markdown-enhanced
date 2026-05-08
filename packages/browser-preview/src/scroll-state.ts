export interface ScrollState {
  x: number;
  y: number;
}

export function captureScrollState(container: HTMLElement): ScrollState {
  const scrollingElement = document.scrollingElement;

  return {
    x: window.scrollX || scrollingElement?.scrollLeft || container.scrollLeft,
    y: window.scrollY || scrollingElement?.scrollTop || container.scrollTop,
  };
}

export function restoreScrollState(
  container: HTMLElement,
  state: ScrollState
): void {
  if (typeof window.scrollTo === "function") {
    window.scrollTo(state.x, state.y);
    return;
  }

  const scrollingElement = document.scrollingElement;
  if (scrollingElement) {
    scrollingElement.scrollLeft = state.x;
    scrollingElement.scrollTop = state.y;
    return;
  }

  container.scrollLeft = state.x;
  container.scrollTop = state.y;
}

export function scrollToLineAnchor(
  container: HTMLElement,
  lineNumber: number
): void {
  const anchor = container.querySelector(
    `[data-source-line="${lineNumber}"]`
  );
  if (anchor instanceof HTMLElement) {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
