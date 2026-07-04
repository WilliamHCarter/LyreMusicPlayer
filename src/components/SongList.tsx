import { For, Show } from "solid-js";
import { type Song } from "./API";

export const SongRow = (props: { song: Song }) => {
  return (
    <>
      <div class="flex items-center justify-between p-2">
        <div>
          <h3 class="text-sm md:text-lg font-semibold text-white">
            {props.song.title}
          </h3>
          <p class="text-xs md:text-sm text-white opacity-50">
            {props.song.artist}
          </p>
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
}

export const SongList = (props: SongListProps) => {
  return (
    <div
      role="region"
      aria-label="Track list"
      tabindex="0"
      class="max-h-[45vh] overflow-y-auto scrollbar-styled focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <For each={props.songList}>{(song) => <SongRow song={song} />}</For>
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
