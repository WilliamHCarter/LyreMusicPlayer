import { For } from "solid-js";
import { type Song } from "./API.ts";

export const SongRow = (props: { song: Song }) => {
  const { song } = props;
  return (
    <>
      <div class="flex items-center justify-between p-2 hover:bg-opacity-10 hover:bg-white transition duration-200">
        <div>
          <h3 class="text-sm md:text-lg font-semibold text-white pointer-events-none">
            {song.title}
          </h3>
          <p class="text-xs md:text-sm text-white opacity-50 pointer-events-none">
            {song.artist}
          </p>
        </div>
        <div class="flex gap-4">
          <p class="text-xs md:text-sm text-white opacity-50 pointer-events-none">
            {formatDuration(song.duration)}
          </p>
          <p class="text-xs md:text-sm text-white opacity-50 pointer-events-none">
            {formatListens(song.listens) ?? 0} listens
          </p>
        </div>
      </div>
      <div class="border-b border-white opacity-30" />
    </>
  );
};

interface SongListProps {
  songList: Song[];
}

export const SongList = ({ songList }: SongListProps) => {
  return (
    <div class="max-h-[45vh] overflow-y-auto">
      <For each={songList}>{(song) => <SongRow song={song} />}</For>
    </div>
  );
};

// Helper functions
const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const formatListens = (listens: number) => {
  if (listens) {
    return listens.toLocaleString();
  }
  return listens;
};

export default SongList;
