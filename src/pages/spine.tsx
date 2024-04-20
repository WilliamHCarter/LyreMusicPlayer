import type { Component } from 'solid-js';

interface SpineProps {
  albumCover: string;
  albumName: string;
  artistName: string;
}

const Spine: Component<SpineProps> = (props) => {
  return (
    <div class="flex flex-col items-center h-full w-full relative">
      <div class=" top-0 w-full pb-full">
        <img
          src={props.albumCover}
          alt="Album Cover"
          class="object-cover w-full h-full"
        />
      </div>
      <div class="relative transform rotate-90 whitespace-nowrap">
        <div class="text-white">{props.albumName}</div>
        <div class="text-white">{props.artistName}</div>
      </div>
    </div>
  );
};

export default Spine;