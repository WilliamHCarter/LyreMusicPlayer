import type { Component } from "solid-js";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import Spine from "./spine";
import getAccessToken from "./API";

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
}

const Spines: Component = () => {
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [mounted, setMounted] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [sumOfWidths, setSumOfWidths] = createSignal(0);
  const [spineWidths, setSpineWidths] = createSignal<number[]>([]);



  onMount(() => {
    const storedAlbums = localStorage.getItem("defaultAlbums");
    if (storedAlbums) {
      setAlbums(JSON.parse(storedAlbums));
    } else {
      fetchAlbums(defaultAlbums);
    }
    setMounted(true);
  });

  createEffect(() => {
    if (mounted()) {
      setTimeout(() => {
        setLoaded(true);
      }, 600);
    }
  });

  createEffect(() => {
    const sum = spineWidths().reduce((acc, width) => acc + width, 0);
    //setSumOfWidths(sum);
    console.log("Sum of widths:", sum);
  });

  createEffect(() => {
    const updateTotalWidth = () => {
      const elements = document.getElementsByClassName("spine-outer");
      let sumWidth = 0;
      for (let i = 0; i < elements.length; i++) {
        sumWidth += (elements[i] as HTMLElement).offsetWidth;
      }
      setSumOfWidths(sumWidth);
    };

    updateTotalWidth();

    window.addEventListener("resize", updateTotalWidth);

    return () => {
      window.removeEventListener("resize", updateTotalWidth);
    };
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
      localStorage.setItem("defaultAlbums", JSON.stringify(albumsData));
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  return (
    <div class="relative w-screen h-screen overflow-hidden" style={`--rectangle-width: ${100 / albums().length}%`}>
      <div class="flex h-full spine-container">
      <For each={albums()}>
        {(album, index) => (
    <div
    class="flex-none h-full w-spineWidth hover:w-hSpineWidth spine-outer"
    style={{
      transform: loaded() ? "translateY(0)" : "translateY(100%)",
      transition: `transform 0.85s ease-in-out ${index() * 60}ms, width 0.4s ease-out`,
    }}
  >
            <Spine
              albumCover={album.images[0].url}
              albumName={album.name}
              artistName={album.artists[0].name}
              miniCover={album.images[2].url}
            />
          </div>
        )}
      </For>
      </div>
    </div>
  );
};
export default Spines;
