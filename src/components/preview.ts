//=============================================================================
// 30-second preview playback.
//
// Plays Spotify's public preview MP3s (Song.previewUrl) through a single
// <audio> element. No auth, token, subscription, or SDK — media elements play
// cross-origin without CORS. The player is album-aware so the bottom-bar skip
// controls move within the current album and previews auto-advance.
//
// Tracks whose label opts out of previews have previewUrl == null; those are
// skipped over by next/prev and never made playable in the first place.
//=============================================================================
import { createSignal } from "solid-js";
import type { Song } from "./API";

export interface PreviewNowPlaying {
  songName: string;
  artistName: string;
  albumName: string;
  albumImage: string;
}

const [previewNowPlaying, setPreviewNowPlaying] =
  createSignal<PreviewNowPlaying | null>(null);
const [previewPlaying, setPreviewPlaying] = createSignal(false);
export { previewNowPlaying, previewPlaying };

/** Album cover for the currently loaded album, used for every track's bar art. */
let albumImage = "";
let albumName = "";
let songs: Song[] = [];
let index = 0;

let audio: HTMLAudioElement | null = null;

const ensureAudio = (): HTMLAudioElement => {
  if (audio) return audio;
  audio = new Audio();
  audio.addEventListener("play", () => setPreviewPlaying(true));
  audio.addEventListener("pause", () => setPreviewPlaying(false));
  audio.addEventListener("ended", () => step(1)); // auto-advance through the album
  return audio;
};

const hasPreview = (s: Song | undefined): s is Song & { previewUrl: string } =>
  !!s && !!s.previewUrl;

const playAt = (i: number) => {
  const song = songs[i];
  if (!hasPreview(song)) return;
  index = i;
  const el = ensureAudio();
  el.src = song.previewUrl;
  setPreviewNowPlaying({
    songName: song.title,
    artistName: song.artist,
    albumName,
    albumImage,
  });
  void el.play();
};

/** Move `dir` (+1/-1) to the next track that actually has a preview. */
const step = (dir: number) => {
  for (let i = index + dir; i >= 0 && i < songs.length; i += dir) {
    if (hasPreview(songs[i])) {
      playAt(i);
      return;
    }
  }
  // No further previewable track: stop at the end of the run.
  audio?.pause();
};

/** Start playback of `songs[startIndex]`, binding this album as the context. */
export const playAlbumPreview = (
  albumSongs: Song[],
  startIndex: number,
  meta: { albumName: string; albumImage: string },
) => {
  songs = albumSongs;
  albumName = meta.albumName;
  albumImage = meta.albumImage;
  playAt(startIndex);
};

export const togglePreview = () => {
  if (!audio) return;
  if (audio.paused) void audio.play();
  else audio.pause();
};

export const previewNext = () => step(1);
export const previewPrev = () => step(-1);
