import { createQuery } from "@tanstack/solid-query";
import type { Album } from "./spines";

const CLIENT_ID = "9a3ddce35111474088a10b319a4969d6";
const CLIENT_SECRET = "5b8ac919fc1c45cb94388a3771ee1feb";
const REDIRECT_URI = "http://localhost:4321";

//====================== Interfaces =======================
export interface Track {
  id: string;
  albumImage: string;
  artistName: string;
  albumName: string;
  songName: string;
}

const apiUrl = "https://api.spotify.com/v1";

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  album: string;
  listens: number;
}


const fetchAlbums = async (albumIds: string[]) => {
  const accessToken = await getAccessToken();
  const apiUrl = "https://api.spotify.com/v1/albums";

  const albumPromises = albumIds.map(async (albumId) => {
    const response = await fetch(`${apiUrl}/${albumId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    const album: Album = {
      id: data.id,
      name: data.name,
      artists: data.artists.map((artist: any) => ({ name: artist.name })),
      images: data.images.map((image: any) => ({ url: image.url })),
      songs: data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms,
        album: data.name,
        listens: track.popularity,
      })),
    };
    return album;
  });

  const albumsData = await Promise.all(albumPromises);
  return albumsData;
};

export const createAlbums = (albumIds: string[]) => {
  return createQuery(() => ({
    queryKey: ["albums", albumIds],
    queryFn: () => fetchAlbums(albumIds)
  }));
};




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


//==================== Login and Auth  =====================

const scopes = ['user-read-private', 'user-read-email'];

export const login = () => {
  const state = generateRandomString(16);
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scopes.join(' '),
      redirect_uri: 'http://localhost:4321',
      state: state,
    });

  localStorage.setItem('spotifyAuthState', state);

  window.location.href = authUrl;
  console.log('Redirecting to Spotify login...');
};

const generateRandomString = (length: number) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const exchangeCodeForToken = async (code: string) => {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'http://localhost:4321',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (response.ok) {
      const data = await response.json();
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;

      // Store the access token and refresh token securely
      localStorage.setItem('spotifyAccessToken', accessToken);
      localStorage.setItem('spotifyRefreshToken', refreshToken);

      console.log('Access token:', accessToken);
      console.log('Refresh token:', refreshToken);
    } else {
      console.error('Error exchanging code for token:', response.status);
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
  }
};