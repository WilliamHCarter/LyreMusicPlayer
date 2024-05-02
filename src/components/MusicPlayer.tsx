import { Music } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { type Song } from './API';
export const [songQueue, setSongQueue] = createSignal<Song[]>([]);

export function addToQueue(song: Song) {
  setSongQueue([...songQueue(), song]);
}
export const MusicPlayer = () => {
  return (
    <div class="w-48 h-full bg-[#222] flex items-center justify-center w-[20vw]">
    <Music class="text-white" />
  </div>
  );
}
