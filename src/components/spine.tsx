import { createResource, createSignal, type Component } from "solid-js";
import {
  getAccentColor,
  desaturateRGBAdjusted,
  FALLBACK_ACCENT,
} from "./Helpers";
import { SongList } from "./SongList";
import type { Song } from "./API";
import { X } from "lucide-solid";
import { playAlbumPreview } from "./preview";

interface SpineProps {
  open: boolean;
  /** true when the shelf stacks vertically (mobile) and each spine lies horizontally */
  vertical: boolean;
  songList: Song[];
  albumCover: string;
  miniCover: string;
  albumName: string;
  artistName: string;
  closeSpine: () => void;
}

const Spine: Component<SpineProps> = (props) => {
  // createResource instead of an async createEffect: tracking of props.miniCover
  // stops at the first await inside an async effect, a resource re-runs properly.
  // getAccentColor memoizes by URL, so remounts/refetches reuse the extraction.
  const [accent] = createResource(
    () => props.miniCover,
    async (url) => {
      try {
        return desaturateRGBAdjusted(await getAccentColor(url), 0.5, 0.25);
      } catch {
        return FALLBACK_ACCENT;
      }
    },
  );
  const accentColor = () => accent() ?? FALLBACK_ACCENT;

  const [isFullImageLoaded, setIsFullImageLoaded] = createSignal(false);

  const handleFullImageLoad = () => {
    setIsFullImageLoaded(true);
  };

  return (
    <div
      style={{ "background-color": accentColor() }}
      class={`flex ${
        props.vertical ? "flex-row items-start" : "flex-col items-center"
      } h-full w-full relative`}
    >
      {props.open && (
        <button
          class="absolute top-4 right-4 text-white hover:text-gray-200"
          aria-label="Close album"
          onClick={(e) => {
            e.stopPropagation();
            props.closeSpine();
          }}
        >
          <X size={24} />
        </button>
      )}
      {/* Dynamic Image — collapsed size tracks the spine's own thickness
          (--rectangle-width / --rectangle-height) instead of a hardcoded 6.25vw/vh */}
      <div
        class="relative"
        style={
          props.vertical
            ? {
                "background-image": `url(${props.miniCover})`,
                "background-size": "cover",
                height: props.open ? "50vw" : "var(--rectangle-height)",
                "margin-left": props.open ? "25%" : "0%",
                "margin-top": props.open ? "7%" : "0%",
                transition:
                  "height 0.4s ease-in-out 0.2s, margin-left 0.4s ease-in-out",
              }
            : {
                "background-image": `url(${props.miniCover})`,
                "background-size": "cover",
                width: props.open ? "32vh" : "var(--rectangle-width)",
                "margin-top": props.open ? "2rem" : "0%",
                transition:
                  "width 0.4s ease-in-out 0.2s, margin-top 0.4s ease-in-out",
              }
        }
      >
        <img
          src={props.albumCover}
          alt={props.albumName}
          loading="lazy"
          decoding="async"
          class={`object-cover transition-opacity duration-500 ${
            isFullImageLoaded() ? "opacity-100" : "opacity-0"
          }`}
          style={
            props.vertical
              ? {
                  "max-height": props.open
                    ? "50vw"
                    : "var(--rectangle-height)",
                }
              : {}
          }
          onload={handleFullImageLoad}
        />
      </div>
      {/* Closed-state title */}
      <div
        class="absolute self-start"
        style={{
          "margin-top": props.vertical ? "0" : "var(--rectangle-width)",
          transition: `opacity 0.2s ease-in-out ${
            !props.open ? "0.5s" : "0.1s"
          }`,
          opacity: !props.open ? 1 : 0,
        }}
      >
        {props.vertical ? (
          <div class="self-start ml-16 p-1 whitespace-nowrap pointer-events-none">
            <div class="text-white text-xl font-semibold">
              {props.albumName}
            </div>
            <div class="text-white opacity-50 text-sm mt-0">
              {props.artistName}
            </div>
          </div>
        ) : (
          <div class="mt-4 self-start ml-[1.3vw] whitespace-nowrap [writing-mode:vertical-rl] pointer-events-none">
            <div class="text-white text-3xl font-semibold">
              {props.albumName}
            </div>
            <div class="text-white opacity-50">{props.artistName}</div>
          </div>
        )}
      </div>
      {/* Song List — pointer-events-none + delayed visibility while closed so the
          invisible list can't capture wheel/touch scroll over closed spines */}
      <div
        class={`w-full px-8 absolute ${
          props.open ? "" : "pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: `opacity ${props.open ? "0.4s" : "0.2s"} ease-in ${
            props.open ? "0.2s" : "0.0s"
          }, transform 0.85s ease-in-out, visibility 0s linear ${
            props.open ? "0s" : "0.3s"
          }`,
          transform: props.open
            ? props.vertical
              ? "translateY(26vh)"
              : "translateY(40vh)"
            : "translateY(70vh)",
          opacity: props.open ? 1 : 0,
          visibility: props.open ? "visible" : "hidden",
        }}
      >
        <div class="mt-4 relative whitespace-nowrap">
          <div
            class={`text-white font-semibold ${
              props.vertical ? "text-2xl" : "text-3xl"
            }`}
          >
            {props.albumName}
          </div>
          <div
            class={`text-white opacity-50 ${props.vertical ? "text-sm" : ""}`}
          >
            {props.artistName}
          </div>
        </div>
        <SongList
          songList={props.songList}
          onPlay={(index) =>
            playAlbumPreview(props.songList, index, {
              albumName: props.albumName,
              albumImage: props.albumCover,
            })
          }
        />
      </div>
    </div>
  );
};

export default Spine;
