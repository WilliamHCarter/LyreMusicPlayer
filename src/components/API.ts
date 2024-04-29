
const CLIENT_ID = '';
const CLIENT_SECRET = '';

export const getAccessToken = async () => {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'client_credentials',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error retrieving access token:', error);
        throw error;
    }
};

const apiUrl = 'https://api.spotify.com/v1';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  album: string;
  listens: number;
}

export const fetchAlbumSongs = async (albumId: string): Promise<Song[]> => {
    const accessToken = await getAccessToken();
  try {
    const response = await fetch(`${apiUrl}/albums/${albumId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    const tracks = data.items;

    const songPromises = tracks.map(async (track: any) => {
      const trackId = track.id;
      const trackResponse = await fetch(`${apiUrl}/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const trackData = await trackResponse.json();
      const listens = trackData.popularity;

      return {
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms,
        album: trackData.album.name,
        listens,
      };
    });

    return Promise.all(songPromises);
  } catch (error) {
    console.error('Error fetching album songs:', error);
    throw error;
  }
};