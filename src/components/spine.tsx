import { createEffect, createSignal, type Component } from "solid-js";
import { getAccentColor } from "./Helpers";
import { desaturateRGBAdjusted } from "./Helpers";
import { SongList } from "./SongList";
import type { Song } from "./API";

interface SpineProps {
  open: boolean;
  width: number;
  songList: Song[];
  albumCover: string;
  miniCover: string;
  albumName: string;
  artistName: string;
}

const Spine: Component<SpineProps> = (props) => {
  const [accentColor, setAccentColor] = createSignal("");
  const [isFullImageLoaded, setIsFullImageLoaded] = createSignal(false);

  createEffect(async () => {
    let color = await getAccentColor(props.miniCover);
    color = desaturateRGBAdjusted(color, 0.5, 0.25);
    setAccentColor(color);
  });

  const handleFullImageLoad = () => {
    setIsFullImageLoaded(true);
  };

  return (
    <div
      style={`background-color: ${accentColor()};`}
      class="flex flex-col items-center h-full w-full relative grow hover:grow-[2]"
    >
      <div
        class="top-0 w-full pb-full relative"
        style={`background-image: url(${props.miniCover}); background-size: cover; width: ${props.width}vw;`}
      >
        <img
          src={props.albumCover}
          alt="Album Cover"
          class={`object-cover transition-opacity duration-500 ${
            isFullImageLoaded() ? "opacity-100" : "opacity-0"
          }`}
          style={{ width: `${props.width}vw` }}
          onload={handleFullImageLoad}
        />
      </div>
      {!props.open && (
        <div class="mt-4 relative whitespace-nowrap [writing-mode:vertical-rl]">
          <div class="text-white text-3xl font-semibold">{props.albumName}</div>
          <div class="text-white opacity-50">{props.artistName}</div>
        </div>
      )}
      {props.open && (
        <div class="w-full px-8">
          <div class="mt-4 relative whitespace-nowrap">
            <div class="text-white text-3xl font-semibold">
              {props.albumName}
            </div>
            <div class="text-white opacity-50">{props.artistName}</div>
          </div>
          <SongList songList={props.songList} />
        </div>
      )}
    </div>
  );
};

export default Spine;
