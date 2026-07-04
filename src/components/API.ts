import { createQuery } from "@tanstack/solid-query";
import type { Album } from "./spines";

// SECURITY NOTE: PUBLIC_ env vars are embedded in the built client bundle.
// Reading these from import.meta.env only keeps the secret out of source
// control -- anyone can still extract it from the shipped JavaScript. The
// previously committed secret must be rotated, and the long-term fix is to
// fetch the album wall data at build time on the server instead.
const CLIENT_ID = import.meta.env.PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.PUBLIC_SPOTIFY_CLIENT_SECRET;

const apiUrl = "https://api.spotify.com/v1";
const tokenUrl = "https://accounts.spotify.com/api/token";

//====================== Interfaces =======================
export interface Track {
  id: string;
  albumImage: string;
  artistName: string;
  albumName: string;
  songName: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  album: string;
  listens: number;
}

//====================== Albums ============================

const fetchAlbums = async (albumIds: string[]): Promise<Album[]> => {
  const accessToken = await getAccessToken();

  // One batched request (the /albums endpoint accepts up to 20 ids).
  const response = await fetch(`${apiUrl}/albums?ids=${albumIds.join(",")}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch albums: ${response.status}`);
  }
  const data = await response.json();

  return data.albums.map((album: any): Album => {
    const images: { url: string }[] = (album.images ?? []).map(
      (image: any) => ({ url: image.url }),
    );
    // The spine components index images[2]; pad with the largest available
    // image so images[0..2] always exist.
    while (images.length > 0 && images.length < 3) {
      images.push({ url: images[0].url });
    }
    return {
      id: album.id,
      name: album.name,
      artists: album.artists.map((artist: any) => ({ name: artist.name })),
      images,
      songs: album.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms,
        album: album.name,
        listens: track.popularity,
      })),
    };
  });
};

export const createAlbums = (albumIds: string[]) => {
  return createQuery(() => ({
    queryKey: ["albums", albumIds],
    queryFn: () => fetchAlbums(albumIds),
    refetchOnWindowFocus: false,
  }));
};

//====================== App token (client credentials) ====
// Used for the public album wall so it keeps working for logged-out visitors.

let appToken: { token: string; expiresAt: number } | null = null;
let appTokenPromise: Promise<string> | null = null;

export const getAccessToken = async (): Promise<string> => {
  if (appToken && Date.now() < appToken.expiresAt) {
    return appToken.token;
  }
  if (appTokenPromise) {
    return appTokenPromise;
  }
  appTokenPromise = (async () => {
    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "client_credentials",
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to get app access token: ${response.status}`);
      }
      const data = await response.json();
      // Refresh one minute early to avoid using a just-expired token.
      appToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      };
      return appToken.token;
    } finally {
      appTokenPromise = null;
    }
  })();
  return appTokenPromise;
};

//====================== Tracks ============================

export const getTrack = async (trackId: string): Promise<Track> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`${apiUrl}/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch track ${trackId}: ${response.status}`);
  }
  const data = await response.json();
  return {
    id: data.id,
    albumImage: data.album.images[0].url,
    artistName: data.artists[0].name,
    albumName: data.album.name,
    songName: data.name,
  };
};

//==================== Login and Auth (PKCE) ================

const ACCESS_TOKEN_KEY = "spotifyAccessToken";
const REFRESH_TOKEN_KEY = "spotifyRefreshToken";
const TOKEN_EXPIRES_AT_KEY = "spotifyTokenExpiresAt";
const CODE_VERIFIER_KEY = "spotifyCodeVerifier";

const generateRandomString = (length: number) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join("");
};

const base64UrlEncode = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const computeCodeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64UrlEncode(digest);
};

export const login = async () => {
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(64);
  localStorage.setItem("spotifyAuthState", state);
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const codeChallenge = await computeCodeChallenge(codeVerifier);
  const scopes = [
    "user-read-private",
    "user-read-email",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
  ];
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: window.location.origin,
      state: state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });

  window.location.href = authUrl;
};

const storeTokens = (data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  // PKCE apps may rotate refresh tokens -- keep the new one when returned.
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.setItem(
    TOKEN_EXPIRES_AT_KEY,
    String(Date.now() + data.expires_in * 1000),
  );
};

export const exchangeCodeForToken = async (code: string) => {
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier; please log in again");
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: window.location.origin,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });
  if (!response.ok) {
    throw new Error(`Error exchanging code for token: ${response.status}`);
  }

  const data = await response.json();
  storeTokens(data);
  localStorage.removeItem(CODE_VERIFIER_KEY);
};

const refreshUserToken = async (
  refreshToken: string,
): Promise<string | null> => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });
  if (!response.ok) {
    // Refresh token revoked or invalid -- treat the user as logged out.
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    return null;
  }
  const data = await response.json();
  storeTokens(data);
  return data.access_token;
};

let refreshPromise: Promise<string | null> | null = null;

/**
 * Returns a valid user access token, refreshing it if expired.
 * Resolves to null when the user is not logged in.
 */
export const getUserToken = async (): Promise<string | null> => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY) ?? "0");
  // Treat the token as expired one minute early.
  if (accessToken && Date.now() < expiresAt - 60_000) {
    return accessToken;
  }

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }
  if (!refreshPromise) {
    refreshPromise = refreshUserToken(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};
