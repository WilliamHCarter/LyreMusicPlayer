/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void;
  Spotify?: {
    Player: {
      new (options: Spotify.PlayerOptions): Spotify.Player;
    };
  };
}

declare namespace Spotify {
  interface Player {
    connect(): Promise<void>;
    disconnect(): void;
    getCurrentState(): Promise<PlaybackState | null>;
    getVolume(): Promise<number>;
    nextTrack(): Promise<void>;
    addListener(event: string, callback: () => void): void;
    on(event: string, callback: () => void): void;
    pause(): Promise<void>;
    previousTrack(): Promise<void>;
    removeListener(event: string, callback: () => void): void;
    resume(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    setName(name: string): Promise<void>;
    setVolume(volume: number): Promise<void>;
    togglePlay(): Promise<void>;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken(callback: (token: string) => void): void;
    volume?: number;
  }

  interface PlaybackState {
    context: {
      uri: string | null;
      metadata: any;
    };
    disallows: {
      resuming: boolean;
      skipping_prev: boolean;
    };
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    uri: string;
    id: string | null;
    type: "track" | "episode" | "ad";
    media_type: "audio" | "video";
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: { url: string }[];
    };
    artists: { uri: string; name: string }[];
  }
}