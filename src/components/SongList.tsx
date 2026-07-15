import { For, Show } from "solid-js";
import { Play } from "lucide-solid";
import { type Song } from "./API";

export const SongRow = (props: { song: Song; onPlay?: () => void }) => {
  return (
    <>
      <div
        class={`flex items-center justify-between p-2 ${
          props.onPlay
            ? "cursor-pointer hover:bg-white hover:bg-opacity-10 transition duration-200"
            : ""
        }`}
        role={props.onPlay ? "button" : undefined}
        tabindex={props.onPlay ? "0" : undefined}
        aria-label={props.onPlay ? `Play ${props.song.title}` : undefined}
        onClick={() => props.onPlay?.()}
        onKeyDown={(e) => {
          if (props.onPlay && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            props.onPlay();
          }
        }}
      >
        <div class="flex items-center gap-2">
          <Show when={props.onPlay}>
            <Play class="text-white opacity-50 shrink-0" size={14} />
          </Show>
          <div>
            <h3 class="text-sm md:text-lg font-semibold text-white">
              {props.song.title}
            </h3>
            <p class="text-xs md:text-sm text-white opacity-50">
              {props.song.artist}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <time
            datetime={formatDurationIso(props.song.duration)}
            aria-label={formatDurationSpoken(props.song.duration)}
            class="text-xs md:text-sm text-white opacity-50"
          >
            {formatDuration(props.song.duration)}
          </time>
          <Show when={props.song.listens}>
            <p class="text-xs md:text-sm text-white opacity-50">
              Popularity: {props.song.listens}/100
            </p>
          </Show>
        </div>
      </div>
      <div class="border-b border-white opacity-30" />
    </>
  );
};

interface SongListProps {
  songList: Song[];
  /** When provided, rows are playable and clicking row i calls onPlay(i). */
  onPlay?: (index: number) => void;
}

export const SongList = (props: SongListProps) => {
  return (
    <div
      role="region"
      aria-label="Track list"
      tabindex="0"
      class="max-h-[45vh] overflow-y-auto scrollbar-styled focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <For each={props.songList}>
        {(song, index) => (
          <SongRow
            song={song}
            // Only tracks with a 30s preview are playable; the rest are
            // browse-only (no play affordance, no click handler).
            onPlay={
              props.onPlay && song.previewUrl
                ? () => props.onPlay!(index())
                : undefined
            }
          />
        )}
      </For>
    </div>
  );
};

// Helper functions
const durationParts = (duration: number) => {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return { minutes, seconds };
};

const formatDuration = (duration: number) => {
  const { minutes, seconds } = durationParts(duration);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const formatDurationIso = (duration: number) => {
  const { minutes, seconds } = durationParts(duration);
  return `PT${minutes}M${seconds}S`;
};

const formatDurationSpoken = (duration: number) => {
  const { minutes, seconds } = durationParts(duration);
  const minutePart = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const secondPart = `${seconds} second${seconds === 1 ? "" : "s"}`;
  return `${minutePart} ${secondPart}`;
};

export default SongList;
