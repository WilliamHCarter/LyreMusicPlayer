import type { Component } from "solid-js";
import { createEffect, createSignal, Match, onMount, Switch } from "solid-js";
import Spine from "./spine";
import { getAccessToken, type Song } from "./API";
import { createAlbums } from "./API";

const defaultAlbums = [
  "19bQiwEKhXUBJWY6oV3KZk",
  "4eLPsYPBmXABThSJ821sqY",
  "5SAhBlk4YQyyEFzoDrvRfP",
  "3uFgYgCEvCSACjB8XHl3hb",
  "5ilsl5R2lGACTnPZMKIp7o",
  "3STQHyw2nOlIbb1FSgPse8",
  "6jfq0ndRJR396m0a6LpYIq",
  "2soUHLxuGGYQCsGrt82HuB",
  "5bjUbZPVTEQcb6W3LquX1E",
  "4euH5WAOsoYT660EFKhuCR",
  "4j8U3RLSad0x109PTuUDav",
  "5oSVYKZLKGCmwYqmJ7AZnO",
  "5wtE5aLX5r7jOosmPhJhhk",
  "4imRDpzmb4zwvxKhNzJhxr",
  "2sJsyTO56RIPMrWmKV4908",
  "4m2880jivSbbyEGAKfITCa",
];

export interface Album {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  songs: Song[];
}

const Spines: Component = () => {
  const [mounted, setMounted] = createSignal(false);
  const [expandedIndex, setExpandedIndex] = createSignal<number | null>(null);
  const [spineOpen, setSpineOpen] = createSignal<boolean[]>([]);
  const [spineWidth, setSpineWidth] = createSignal(0);

  const albums = createAlbums(defaultAlbums);

  onMount(() => {
    setMounted(true);
  });

  createEffect(() => {
    if (mounted() && albums.isSuccess) {
      setTimeout(() => {
        setSpineOpen(new Array(albums.data.length).fill(false));
        setSpineWidth(100 / albums.data.length);
      }, 300);
    }
  });
  const handleClick = (index: number) => {
    let isSameIndex: boolean = expandedIndex() === index;
    if (!isSameIndex && spineOpen()[index] === false) {
      toggleSpine(index);
    }
  };

  const toggleSpine = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
    setSpineOpen((prev) =>
      prev.map((_, i) => (i === index ? !prev[i] : false))
    );
  };

  return (
    <div
      class="relative w-screen h-screen overflow-x-scroll overflow-y-hidden"
      style={`--rectangle-width: ${100 / Math.min(albums.data?.length || 0, 16)}vw`}
    >
      <Switch>
        <Match when={albums.isLoading}>
          <div class="flex items-center justify-center h-full">
            <div class="text-2xl">Loading...</div>
          </div>
        </Match>
        <Match when={albums.isError}>
          <div class="flex items-center justify-center h-full">
            <div class="text-2xl text-red-500">Error fetching albums: {albums?.error?.message}</div>
          </div>
        </Match>
        <Match when={albums.isSuccess}>
          <div
            class="flex h-full spine-container"
            style={{
              transform: expandedIndex()
                ? `translateX(calc(-1.6*var(--rectangle-width)*(0.36*${expandedIndex()})))`
                : 'translateX(0)',
              transition: 'transform 0.5s ease-out',
            }}
          >
            {albums?.data?.map((album, index) => (
              <div
                class="flex-none h-full w-spineWidth"
                style={{
                  transform: mounted() ? 'translateY(0)' : 'translateY(100%)',
                  transition: `transform 0.85s ease-in-out ${index * 60}ms, width 0.5s ease-out`,
                  'flex-shrink': 0,
                  width: expandedIndex() === index ? '60%' : 'var(--rectangle-width)',
                }}
                onClick={() => handleClick(index)}
              >
                <Spine
                  open={spineOpen()[index]}
                  width={spineWidth()}
                  songList={album.songs}
                  albumCover={album.images[0].url}
                  albumName={album.name}
                  artistName={album.artists[0].name}
                  miniCover={album.images[2].url}
                  closeSpine={() => toggleSpine(index)}
                  index={index}
                />
              </div>
            ))}
          </div>
        </Match>
      </Switch>
    </div>
  );
};
export default Spines;
