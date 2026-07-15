import type { Component } from "solid-js";
import {
  createEffect,
  createSignal,
  Match,
  onCleanup,
  onMount,
  Switch,
  For,
} from "solid-js";
import Spine from "./spine";
import { createAlbums, type Song } from "./API";

const defaultAlbums = [
  "19bQiwEKhXUBJWY6oV3KZk",
  "4eLPsYPBmXABThSJ821sqY",
  "5SAhBlk4YQyyEFzoDrvRfP",
  "3uFgYgCEvCSACjB8XHl3hb",
  "5ilsl5R2lGACTnPZMKIp7o",
  "3STQHyw2nOlIbb1FSgPse8",
  "6jfq0ndRJR396m0a6LpYIq",
  "2soUHLxuGGYQCsGrt82HuB",
  "5bjUbZPVTEQcb6W3LquX1E",
  "4euH5WAOsoYT660EFKhuCR",
  "4j8U3RLSad0x109PTuUDav",
  "5oSVYKZLKGCmwYqmJ7AZnO",
  "5wtE5aLX5r7jOosmPhJhhk",
  "4imRDpzmb4zwvxKhNzJhxr",
  "2sJsyTO56RIPMrWmKV4908",
  "4m2880jivSbbyEGAKfITCa",
];

export interface Album {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  songs: Song[];
}

// Entrance timing. SLIDE_MS must match the transform transition duration below.
const STAGGER_MS = 60;
const SLIDE_MS = 850;
// An open spine's share of the viewport axis (60% wide on desktop, 60vh on mobile).
const EXPANDED_PCT = 60;
// Spine thickness is sized so at most this many spines fill one viewport.
const MAX_VISIBLE = 16;

// Module-level signal (same pattern as AuthHandler's isAuthorizing) so BottomBar
// can slide up exactly when the shelf entrance finishes instead of a hardcoded timeout.
export const [entranceDone, setEntranceDone] = createSignal(false);

// cubic-bezier(0, 0, 0.58, 1) — the exact curve of CSS `ease-out`. The recenter
// scroll tween must use this so it stays in lockstep with the spine's CSS width/
// height `ease-out` growth; a mismatched curve makes the opened album drift one
// way then the other (scroll racing ahead of the growth) instead of blooming
// evenly from its center.
const easeOutCss = (() => {
  const x2 = 0.58;
  const bx = 3 * x2; // cx = 0, so bx = 3*(x2-0)-0
  const ax = 1 - bx; // 1 - cx - bx
  const by = 3; // cy = 0, y2 = 1
  const ay = 1 - by; // -2
  const sampleX = (t: number) => (ax * t + bx) * t * t;
  const sampleY = (t: number) => (ay * t + by) * t * t;
  const solveT = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x;
      const d = (3 * ax * t + 2 * bx) * t; // dX/dt
      if (Math.abs(d) < 1e-6) break;
      t -= dx / d;
    }
    return t;
  };
  return (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : sampleY(solveT(p)));
})();

const Spines: Component = () => {
  // Entrance state: `entered` flips once when data arrives; CSS per-index
  // transition-delay does all the staggering. `staggering` gates those delays
  // so they are cleared after the entrance and can't lag later transforms.
  const [entered, setEntered] = createSignal(false);
  const [staggering, setStaggering] = createSignal(true);

  // UI state: expandedIndex is the single source of truth for which spine is open.
  const [expandedIndex, setExpandedIndex] = createSignal<number | null>(null);
  const [vertical, setVertical] = createSignal(false);

  // Data management
  const albums = createAlbums(defaultAlbums);

  // Spine thickness in viewport units (vw on desktop, vh on mobile).
  const unit = () =>
    100 / Math.min(albums.data?.length || MAX_VISIBLE, MAX_VISIBLE);

  // Shelf shift per index when a spine opens: each collapsed spine's on-screen
  // share shrinks from unit() to (100 - EXPANDED_PCT)/(n - 1), so the shelf slides
  // by that difference for every spine before the open one. Replaces the old
  // magic calc(-1.6 * w * 0.36 * i), which was exact only for n = 16 at 60%.
  const shiftPerIndex = () => {
    const n = albums.data?.length ?? 0;
    return n > 1 ? unit() - (100 - EXPANDED_PCT) / (n - 1) : 0;
  };

  onMount(() => {
    const mq = window.matchMedia("(max-width: 712px)");
    const updateOrientation = () => setVertical(mq.matches);
    updateOrientation();
    mq.addEventListener("change", updateOrientation);
    onCleanup(() => mq.removeEventListener("change", updateOrientation));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  // The bottom bar waits on entranceDone; if the shelf can't load there is no
  // entrance to wait for, so release it immediately.
  createEffect(() => {
    if (albums.isError) setEntranceDone(true);
  });

  // Start the entrance once per dataset: `entered` only ever flips forward, so a
  // query refetch re-running this effect is a no-op and can't reset UI state.
  createEffect(() => {
    if (!albums.isSuccess || !albums.data || entered()) return;

    const n = albums.data.length;
    const finishEntrance = () => {
      setStaggering(false);
      setEntranceDone(true);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reveal everything immediately; the global CSS kill-switch removes the
      // remaining transition so nothing animates.
      setStaggering(false);
      setEntered(true);
      setEntranceDone(true);
      return;
    }

    // Double rAF is load-bearing: a single rAF can fire before the browser commits
    // the fresh nodes' initial offscreen styles, which would skip spine 0's slide-in.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setEntered(true);
        // Entrance is done when the last spine's delayed slide completes.
        setTimeout(finishEntrance, n * STAGGER_MS + SLIDE_MS);
      }),
    );
  });

  const toggleSpine = (index: number) =>
    setExpandedIndex((prev) => (prev === index ? null : index));

  // Recenter the opened album with a real (animated) scroll offset instead of a
  // CSS transform on the flex track. A transform is visual-only, so it corrupted
  // the scroll bounds — the first album got pushed out of reach and a dead gap
  // appeared at the far end. Scrolling reproduces the same center-out motion
  // (the offset matches the old `shiftPerIndex * index` shift, converted to px)
  // while keeping the bounds honest: scroll clamps to real content, and album 0
  // stays reachable at scroll 0.
  let scrollerRef: HTMLDivElement | undefined;
  let scrollAnim: number | undefined;
  let scrollBeforeOpen = 0;
  let wasOpen = false;

  const readScroll = () =>
    scrollerRef ? (vertical() ? scrollerRef.scrollTop : scrollerRef.scrollLeft) : 0;

  // rAF tween of the scroll axis over ~0.5s to match the spine growth transition.
  const animateScrollTo = (target: number) => {
    const el = scrollerRef;
    if (!el) return;
    if (scrollAnim) cancelAnimationFrame(scrollAnim);
    const axisVertical = vertical();
    const start = axisVertical ? el.scrollTop : el.scrollLeft;
    const delta = target - start;
    const DURATION = 500; // matches the spine growth transition (0.5s)
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION);
      const v = start + delta * easeOutCss(p);
      if (axisVertical) el.scrollTop = v;
      else el.scrollLeft = v;
      if (p < 1) scrollAnim = requestAnimationFrame(step);
    };
    scrollAnim = requestAnimationFrame(step);
  };

  createEffect(() => {
    const idx = expandedIndex();
    const opening = idx !== null;
    // Remember the pre-open scroll only on the closed→open edge, so opening a
    // second album (open→open) doesn't overwrite it and close can restore it.
    if (opening && !wasOpen) scrollBeforeOpen = readScroll();
    wasOpen = opening;

    if (!scrollerRef) return;
    if (idx === null) {
      animateScrollTo(scrollBeforeOpen);
    } else {
      const axisPx = vertical() ? scrollerRef.clientHeight : scrollerRef.clientWidth;
      animateScrollTo((shiftPerIndex() * idx * axisPx) / 100);
    }
  });

  return (
    <div
      ref={scrollerRef}
      // Scroll the axis the flex track actually runs on: Y for the vertical
      // (mobile) shelf, X for the horizontal (desktop) shelf. Driven off
      // vertical() rather than a sm: class so it tracks the same 712px breakpoint.
      class={`relative w-screen h-screen scrollbar-hide ${
        vertical()
          ? "overflow-y-auto overflow-x-hidden"
          : "overflow-x-auto overflow-y-hidden"
      }`}
      style={{
        // Floor the spine thickness so titles/covers aren't crammed on small
        // viewports. Desktop: never thinner than its width at a 1300px viewport
        // (1vw = 13px there). Mobile: a modest absolute floor, a bit wider than
        // the ~50px it was. Below the floor the shelf overflows and scrolls.
        "--rectangle-width": `max(${unit()}vw, ${unit() * 13}px)`,
        "--rectangle-height": `max(${unit()}vh, 64px)`,
      }}
    >
      <Switch>
        <Match when={albums.isLoading}>
          <div class="flex items-center justify-center h-full scrollbar-hide">
            <div class="text-2xl text-gray-300 font-semibold">Loading...</div>
          </div>
        </Match>
        <Match when={albums.isError}>
          <div class="flex items-center justify-center h-full">
            <div class="text-2xl text-red-500">
              Error fetching albums: {albums?.error?.message}
            </div>
          </div>
        </Match>
        <Match when={albums.isSuccess}>
          <div
            // pb-12 (mobile only) pads the bottom of the vertical shelf by the
            // fixed BottomBar's height (h-12) so the last album can scroll clear
            // of it instead of being hidden behind it.
            class={`${vertical() ? "flex flex-col w-full pb-12" : "flex h-full"} spine-container`}
          >
            <For each={albums.data}>
              {(album, index) => (
                <div
                  role="button"
                  tabindex="0"
                  aria-expanded={expandedIndex() === index()}
                  aria-label={`${album.name} by ${album.artists[0]?.name ?? "Unknown artist"}`}
                  // Clip collapsed spines so their absolute, transform-displaced
                  // song lists stop leaking into the scroller's scrollable region
                  // (the source of desktop's blank space and mobile's phantom
                  // height). The open spine stays unclipped: its song list
                  // intentionally extends past the spine box.
                  class={`flex-none cursor-pointer ${
                    expandedIndex() === index() ? "" : "overflow-hidden"
                  } ${
                    vertical()
                      ? "w-full h-[var(--rectangle-height)]"
                      : "h-full w-[var(--rectangle-width)]"
                  }`}
                  style={{
                    transform: entered()
                      ? "translate(0)"
                      : vertical()
                        ? "translateX(100%)"
                        : "translateY(100%)",
                    transition: `transform ${SLIDE_MS}ms ease-in-out${
                      staggering() ? ` ${index() * STAGGER_MS}ms` : ""
                    }, ${vertical() ? "height" : "width"} 0.5s ease-out`,
                    "flex-shrink": 0,
                    [vertical() ? "height" : "width"]:
                      expandedIndex() === index()
                        ? vertical()
                          ? `${EXPANDED_PCT}vh`
                          : `${EXPANDED_PCT}%`
                        : vertical()
                          ? "var(--rectangle-height)"
                          : "var(--rectangle-width)",
                  }}
                  onClick={() => toggleSpine(index())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSpine(index());
                    }
                  }}
                >
                  <Spine
                    open={expandedIndex() === index()}
                    vertical={vertical()}
                    songList={album.songs}
                    albumCover={album.images[0]?.url}
                    albumName={album.name}
                    artistName={album.artists[0]?.name ?? ""}
                    miniCover={album.images[2]?.url ?? album.images[0]?.url}
                    closeSpine={() => toggleSpine(index())}
                  />
                </div>
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

export default Spines;
