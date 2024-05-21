import { createEffect, createSignal, For, onMount, type Signal } from "solid-js";
import type { Song } from "./API";
import { desaturateRGBAdjusted, getAccentColor } from "./Helpers";
import { set } from "astro/zod";

//Dynamic Album Cover
const CCover = (props: { albumCover: string; miniAlbumCover: string }) => {
  const [isFullImageLoaded, setIsFullImageLoaded] = createSignal(false);
  const handleFullImageLoad = () => {
    setIsFullImageLoaded(true);
  };

  return (
    <img
      src={props.albumCover}
      alt="Album Cover"
      class={`object-cover transition-opacity duration-500 ${
        isFullImageLoaded() ? "opacity-100" : "opacity-0"
      }`}
      onload={handleFullImageLoad}
    />
  );
};

//Outer Item Structure
interface CItemProps {
  width: number;
  songList: Song[];
  albumCover: string;
  miniCover: string;
  albumName: string;
  artistName: string;
  index: number;
  spineOpen: boolean[];
  setSpineOpen: (index: number) => void;
}

const CItem = (props: CItemProps) => {
  const [expanded, setExpanded] = createSignal(false);
  const [accentColor, setAccentColor] = createSignal("");
  const [isFullImageLoaded, setIsFullImageLoaded] = createSignal(false);

  const handleClick = () => {
    setExpanded(!expanded());
  };

  //Get accent color for spine
  createEffect(async () => {
    let color = await getAccentColor(props.miniCover);
    color = desaturateRGBAdjusted(color, 0.5, 0.25);
    setAccentColor(color);
  });

  createEffect(() => {
    if (props.spineOpen.some((isOpen) => isOpen)) {
      setExpanded(false);
    }
    console.log("update")
  }, props.spineOpen);

  const handleFullImageLoad = () => {
    setIsFullImageLoaded(true);
  };

  return (
    <div
      class={`inline-block h-full`}
      style={{
        width: expanded() ? "32vh" : `6.25vw`,
        "background-color": accentColor(),
      }}
      onClick={handleClick}
    >
      <CCover albumCover={props.albumCover} miniAlbumCover={props.miniCover} />
      <div class="mt-4 self-start ml-[1.3vw] whitespace-nowrap [writing-mode:vertical-rl] pointer-events-none">
          <div class="text-white text-3xl font-semibold">{props.albumName}</div>
          <div class="text-white opacity-50">{props.artistName}</div>
        </div>
    </div>
  );
};

//================================================================================================

interface Album {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  songs: Song[];
}

const Carousel = () => {
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [mounted, setMounted] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [spineWidth, setSpineWidth] = createSignal(0);

  const [spineOpen, setSpineOpen] = createSignal<boolean[]>([]);

  onMount(() => {
    const storedAlbums = localStorage.getItem("defaultAlbums");
    setAlbums(JSON.parse(storedAlbums!));
    setMounted(true);
  });

  createEffect(() => {
    if (mounted()) {
      setTimeout(() => {
        setLoaded(true);
        setSpineWidth(100 / albums().length);
      }, 300);
    }
  });

  return (
    <div class="carousel overflow-x-scroll whitespace-nowrap h-screen">
        <For each={albums()}>
          {(album, index) => (
          <CItem
            width={spineWidth()}
            songList={album.songs}
            albumCover={album.images[0].url}
            albumName={album.name}
            artistName={album.artists[0].name}
            miniCover={album.images[2].url}
            index={index()}
            spineOpen={spineOpen()}
            setSpineOpen={setSpineOpen}
          />
        )}
      </For>
    </div>
  );
};

export default Carousel;
