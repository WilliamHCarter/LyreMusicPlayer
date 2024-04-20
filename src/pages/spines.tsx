import type { Component} from 'solid-js';
import { For, createSignal, onMount } from 'solid-js';
import Spine from './spine';

const defaultAlbums = [
  '1yXlpa0dqoQCfucRLcWgUX',
  '4eLPsYPBmXABThSJ821sqY',
];

const Spines: Component = () => {
  const [albums, setAlbums] = createSignal([]);

  const fetchAlbums = async (albumIds: string[]) => {
    const accessToken = '';
    const apiUrl = 'https://api.spotify.com/v1/albums';

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
    setAlbums(albumsData);
    localStorage.setItem('defaultAlbums', JSON.stringify(albumsData));
  };

  onMount(() => {
    const storedAlbums = localStorage.getItem('defaultAlbums');
    if (storedAlbums) {
      setAlbums(JSON.parse(storedAlbums));
    } else {
      fetchAlbums(defaultAlbums);
    }
  });

  return (
    <div class="flex justify-center items-center h-screen">
      <For each={albums()}>
        {(album) => (
          <Spine
            albumCover={album.images[0].url}
            albumName={album.name}
            artistName={album.artists[0].name}
          />
        )}
      </For>
    </div>
  );
};

export default Spines;