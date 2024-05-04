const CLIENT_ID = "";
const CLIENT_SECRET = "";

//====================== Interfaces =======================
export interface Track {
  id: string;
  albumImage: string;
  artistName: string;
  albumName: string;
  songName: string;
}

export const getAccessToken = async () => {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error retrieving access token:", error);
    throw error;
  }
};

const apiUrl = "https://api.spotify.com/v1";

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
    console.error("Error fetching album songs:", error);
    throw error;
  }
};

//==================== Song Management =====================
export const addToQueue = async (trackUri: string) => {
  const accessToken = await getAccessToken();
  try {
    await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(
        trackUri
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    console.error("Error adding track to queue:", error);
    throw error;
  }
};

export const getQueue = async (): Promise<any[]> => {
  const accessToken = await getAccessToken();
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/queue`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    return data.queue;
  } catch (error) {
    console.error("Error getting queue:", error);
    throw error;
  }
};

const makeSpotifyRequest = async (endpoint: string, method: string) => {
    const accessToken = await getAccessToken();
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Spotify API request failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error making Spotify API request to ${endpoint}:`, error);
      throw error;
    }
  };
  
  export const playNext = async () => {
    await makeSpotifyRequest("next", "POST");
  };
  
  export const playPrevious = async () => {
    await makeSpotifyRequest("previous", "POST");
  };
  
  export const playTrack = async () => {
    await makeSpotifyRequest("play", "PUT");
  };
  
  export const pauseTrack = async () => {
    await makeSpotifyRequest("pause", "PUT");
  };
export const getTrack = async (trackId: string): Promise<Track> => {
  const accessToken = await getAccessToken();
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    const track: Track = {
      id: data.id,
      albumImage: data.album.images[0].url,
      artistName: data.artists[0].name,
      albumName: data.album.name,
      songName: data.name,
    };
    return track;
  } catch (error) {
    console.error("Error fetching track:", error);
    throw error;
  }
};
