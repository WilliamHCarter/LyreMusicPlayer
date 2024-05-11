import { For } from "solid-js";
import { type Song } from "./API.ts";
import { SongRow } from "./SongList.tsx";


interface QueueProps {
  songList: Song[];
}

export const Queue = ({ songList }: QueueProps) => {
  return (
    <div class="max-h-[45vh] overflow-y-auto">
      <For each={songList}>{(song) => <SongRow song={song} />}</For>
    </div>
  );
};

export default Queue;