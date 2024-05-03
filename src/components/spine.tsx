import { createEffect, createSignal, type Component } from "solid-js";
import { getAccentColor } from "./Helpers";
import { desaturateRGBAdjusted } from "./Helpers";
import { SongList } from "./SongList";
import type { Song } from "./API";
import { songQueue, addToQueue } from "./MusicPlayer";

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
        class=" relative"
        style={{
          "background-image": `url(${props.miniCover})`,
          "background-size": "cover",
          width: props.open ? "18vw" : `6.25vw`,
          "margin-top": props.open ? "2rem" : "0%",
          transition:
            "width 0.4s ease-in-out 0.2s, margin-top 0.4s ease-in-out",
        }}
      >
        <img
          src={props.albumCover}
          alt="Album Cover"
          class={`object-cover transition-opacity duration-500 ${
            isFullImageLoaded() ? "opacity-100" : "opacity-0"
          }`}
          onload={handleFullImageLoad}
        />
      </div>
      <div class="absolute self-start mt-[6.25vw]"
        style={{
          transition: `opacity 0.2s ease-in-out ${!props.open ? "0.5s" : "0.1s"}`,
          opacity: !props.open ? 1 : 0,
        }}
      >
        <div class="mt-4 self-start ml-[1.3vw] whitespace-nowrap [writing-mode:vertical-rl]">
          <div class="text-white text-3xl font-semibold">{props.albumName}</div>
          <div class="text-white opacity-50">{props.artistName}</div>
        </div>
      </div>

      {!props.open && (
        <div
          class="w-full px-8 "
          style={{
            transition: "opacity 0.4s ease-in 0.4s",
            opacity: props.open ? 1 : 0,
          }}
        >
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
