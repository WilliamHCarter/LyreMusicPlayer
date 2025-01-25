import { For } from "solid-js";
import { type Song } from "./API";
import { SongRow } from "./SongList";

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
