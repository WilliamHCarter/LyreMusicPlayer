import { createEffect, createSignal, type Component } from "solid-js";
import { getAccentColor } from "./Helpers";
import { desaturateRGBAdjusted } from "./Helpers";

interface SpineProps {
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
        style={`background-image: url(${props.miniCover}); background-size: cover;`}
      >
        <img
          src={props.albumCover}
          alt="Album Cover"
          class={`object-cover w-full h-full ${
            isFullImageLoaded() ? "opacity-100" : "opacity-0"
          } transition-opacity duration-500`}
          onload={handleFullImageLoad}
        />
      </div>
      <div class="mt-4 relative whitespace-nowrap [writing-mode:vertical-rl]">
        <div class="text-white text-3xl font-semibold">{props.albumName}</div>
        <div class="text-white opacity-50">{props.artistName}</div>
      </div>
    </div>
  );
};

export default Spine;