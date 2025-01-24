import { createEffect, createSignal, type Component } from "solid-js";
import { getAccentColor } from "./Helpers";
import { desaturateRGBAdjusted } from "./Helpers";
import { SongList } from "./SongList";
import type { Song } from "./API";
import { X } from "lucide-solid";

interface MobileSpineProps {
  open: boolean;
  height: number;
  songList: Song[];
  albumCover: string;
  miniCover: string;
  albumName: string;
  artistName: string;
  closeSpine: () => void;
  index: number;
}

const MobileSpine: Component<MobileSpineProps> = (props) => {
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
      class={`flex flex-row items-center w-full h-full relative hover:grow-[2]`}
    >
      {props.open && (
        <button
          class="absolute top-4 right-4 text-white hover:text-gray-200"
          onMouseDown={() => props.closeSpine()}
        >
          <X size={24} />
        </button>
      )}
      {/* Dynamic Image */}
      <div
        class="relative"
        style={{
          "background-image": `url(${props.miniCover})`,
          "background-size": "cover",
          height: props.open ? "50vw" : "6.25vh",
          "margin-left": props.open ? "25%" : "0%",
          "margin-top": props.open ? "5%" : "0%",
          transition:
            "height 0.4s ease-in-out 0.2s, margin-left 0.4s ease-in-out",
        }}
      >
        <img
          src={props.albumCover}
          alt="Album Cover"
          class={`${props.open ? "max-h-[50vw]" : "max-h-[6.25vh]"} object-cover transition-opacity duration-500 ${
            isFullImageLoaded() ? "opacity-100" : "opacity-0"
          }`}
          onload={handleFullImageLoad}
        />
      </div>
      <div
        class="absolute self-start"
        style={{
          transition: `opacity 0.2s ease-in-out ${
            !props.open ? "0.5s" : "0.1s"
          }`,
          opacity: !props.open ? 1 : 0,
        }}
      >
        <div class="self-start ml-16 p-1 whitespace-nowrap pointer-events-none">
          <div class="text-white text-xl font-semibold">{props.albumName}</div>
          <div class="text-white opacity-50 text-sm mt-0">
            {props.artistName}
          </div>
        </div>
      </div>
      {/* Song List */}
      {
        <div
          class="w-full px-8 absolute"
          style={{
            transition: `opacity ${props.open ? "0.4s" : "0.2s"} ease-in ${
              props.open ? "0.2s" : "0.0s"
            }, transform 0.85s ease-in-out`,
            transform: props.open ? "translateY(40vh)" : "translateY(70vh)",
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
      }
    </div>
  );
};

export default MobileSpine;
