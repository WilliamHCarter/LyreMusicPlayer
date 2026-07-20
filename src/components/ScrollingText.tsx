import {
  children as resolveChildren,
  createEffect,
  onCleanup,
  onMount,
  type Component,
  type JSX,
} from "solid-js";

interface ScrollingTextProps {
  children: JSX.Element;
  /** Classes for the (clipping) container — text sizing/colour go here. */
  class?: string;
}

/**
 * Now-playing marquee. If the text is wider than its container it ping-pong
 * scrolls to reveal the whole string — pause at the start, ease to the end,
 * pause, ease back, repeat — the classic music-player behaviour. If it fits, it
 * stays static. Honours prefers-reduced-motion by staying put and exposing the
 * full text through a title tooltip.
 */
export const ScrollingText: Component<ScrollingTextProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let innerRef: HTMLDivElement | undefined;
  let anim: Animation | undefined;

  const resolved = resolveChildren(() => props.children);

  const stop = () => {
    anim?.cancel();
    anim = undefined;
    if (innerRef) innerRef.style.transform = "translateX(0)";
  };

  const setup = () => {
    const container = containerRef;
    const inner = innerRef;
    if (!container || !inner) return;
    stop();

    // Full text as a tooltip regardless — useful whether it scrolls or clips.
    container.title = inner.textContent ?? "";

    const overflow = inner.scrollWidth - container.clientWidth;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Ignore sub-character overflows (< ~half a glyph): a tiny twitchy scroll
    // reads worse than clipping a couple of pixels. Real long titles overflow
    // by far more and still scroll.
    if (overflow <= 8 || reduced) return; // fits, or reduced motion → static

    const SPEED = 45; // px/second
    const travel = (overflow / SPEED) * 1000;
    const PAUSE = 1200; // dwell at each end so the text is readable
    const total = PAUSE * 2 + travel * 2;
    anim = inner.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: PAUSE / total },
        {
          transform: `translateX(${-overflow}px)`,
          offset: (PAUSE + travel) / total,
        },
        {
          transform: `translateX(${-overflow}px)`,
          offset: (PAUSE * 2 + travel) / total,
        },
        { transform: "translateX(0)", offset: 1 },
      ],
      { duration: total, iterations: Infinity, easing: "ease-in-out" },
    );
  };

  // Re-measure whenever the text changes. resolved() is tracked; defer the
  // measurement to the next frame so the DOM binding has committed the new text
  // before we read scrollWidth.
  createEffect(() => {
    resolved();
    const raf = requestAnimationFrame(setup);
    onCleanup(() => cancelAnimationFrame(raf));
  });

  onMount(() => {
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    onCleanup(() => {
      window.removeEventListener("resize", onResize);
      anim?.cancel();
    });
  });

  return (
    <div ref={containerRef} class={`overflow-hidden ${props.class ?? ""}`}>
      <div
        ref={innerRef}
        class="inline-block whitespace-nowrap will-change-transform"
      >
        {resolved()}
      </div>
    </div>
  );
};

export default ScrollingText;
