import type { Component } from "solid-js";
import { createEffect, createSignal, For, onMount } from "solid-js";
import Spine from "./spine";
import { getAccessToken, type Song } from "./API";

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

interface Album {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  songs: Song[];
}

const Spines: Component = () => {
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [mounted, setMounted] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [expandedIndex, setExpandedIndex] = createSignal<number | null>(null);
  const [spineOpen, setSpineOpen] = createSignal<boolean[]>([]);
  const [spineWidth, setSpineWidth] = createSignal(0);
  
  onMount(() => {
    const storedAlbums = localStorage.getItem("defaultAlbums");
    if (storedAlbums) {
      setAlbums(JSON.parse(storedAlbums));
      setSpineOpen(new Array(JSON.parse(storedAlbums).length).fill(false));
    } else {
      fetchAlbums(defaultAlbums);
    }
    setMounted(true);

  });

  createEffect(() => {
    if (mounted()) {
      setTimeout(() => {
        setLoaded(true);
        setSpineWidth(100 / albums().length);
      }, 600);
    }
  });

  const fetchAlbums = async (albumIds: string[]) => {
    try {
      const accessToken = await getAccessToken();
      const apiUrl = "https://api.spotify.com/v1/albums";

      const albumPromises = albumIds.map(async (albumId) => {
        const response = await fetch(`${apiUrl}/${albumId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();
        return data;
      });

      const albumsData = await Promise.all(albumPromises);
      setAlbums(albumsData as Album[]);
      albumsData.forEach((album, index) => {
          setAlbums((prev) => {
            const songs = album.tracks.items.map((track: any) => ({
              id: track.id,
              title: track.name,
              artist: track.artists[0].name,
              duration: track.duration_ms,
              album: album.name,
              listens: track.popularity,
            }));
            const newAlbums = [...prev];
            newAlbums[index].songs = songs;
            return newAlbums;
          });
      });
      setSpineOpen(new Array(albumsData.length).fill(false));
      localStorage.setItem("defaultAlbums", JSON.stringify(albumsData));
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const handleClick = (index: number) => {
    let isSameIndex: boolean = expandedIndex() === index;
    if (!isSameIndex && spineOpen()[index] === false) {
      closeSpine(index);
    }
  };

  const closeSpine = (index: number) => {
    setExpandedIndex(prevIndex => prevIndex === index ? null : index);
    setSpineOpen((prev) => prev.map((_, i) => i === index ? !prev[i] : false));
    console.log("spine closed");
  }


  
  return (
    <div class="relative w-screen h-screen overflow-hidden" style={`--rectangle-width: ${100 / albums().length}%`}>
      <div class="flex h-full spine-container" style={{     
         transform: expandedIndex() ? "translateX(calc(-2*var(--rectangle-width)))" : "translateX(0)",
         transition: "transform 0.4s ease-out",
}}>
      <For each={albums()}>
        {(album, index) => (
    <div
    class="flex-none h-full w-spineWidth"
    style={{
      transform: loaded() ? "translateY(0)" : "translateY(100%)", 
      transition: `transform 0.85s ease-in-out ${index() * 60}ms, width 0.5s ease-out`,
      'flex-shrink': 0,
      width: expandedIndex() === index() ? "60%" : "var(--rectangle-width)",
    }}
    onClick={() => handleClick(index())}
  >
            <Spine
              open={spineOpen()[index()]}
              width={spineWidth()}
              songList={album.songs}
              albumCover={album.images[0].url}
              albumName={album.name}
              artistName={album.artists[0].name}
              miniCover={album.images[2].url}
              closeSpine={() => closeSpine(expandedIndex()!)}
            />
          </div>
        )}
      </For>
      </div>
    </div>
  );
};
export default Spines;