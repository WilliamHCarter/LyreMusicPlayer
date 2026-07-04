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

  return (
    <div
      class="relative w-screen h-screen overflow-x-scroll overflow-y-hidden scrollbar-hide"
      style={{
        "--rectangle-width": `${unit()}vw`,
        "--rectangle-height": `${unit()}vh`,
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
            class={`${vertical() ? "flex flex-col w-full" : "flex h-full"} spine-container`}
            style={{
              transform:
                expandedIndex() !== null
                  ? vertical()
                    ? `translateY(${-shiftPerIndex() * expandedIndex()!}vh)`
                    : `translateX(${-shiftPerIndex() * expandedIndex()!}vw)`
                  : "translate(0)",
              transition: "transform 0.5s ease-out",
            }}
          >
            <For each={albums.data}>
              {(album, index) => (
                <div
                  role="button"
                  tabindex="0"
                  aria-expanded={expandedIndex() === index()}
                  aria-label={`${album.name} by ${album.artists[0]?.name ?? "Unknown artist"}`}
                  class={`flex-none cursor-pointer ${
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
