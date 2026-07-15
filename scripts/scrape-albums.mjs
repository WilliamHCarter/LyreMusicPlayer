// Regenerates src/data/albums.json from Spotify's public embed pages.
//
// The embed page (open.spotify.com/embed/album/<id>) ships a __NEXT_DATA__ JSON
// blob with album name, artist, cover art, and the full tracklist including
// per-track 30s preview MP3 URLs — all with NO auth, token, or subscription.
// We snapshot it to a committed file so the shelf renders instantly and offline
// for every visitor, immune to the Web API's 403s.
//
// Run:  node scripts/scrape-albums.mjs
//
// Caveat: __NEXT_DATA__ is an unofficial surface and could change shape; if this
// script starts failing, that's why. It only reads public, factual metadata.
import { writeFile } from "node:fs/promises";

// The default shelf, in display order. Comment = album, (preview coverage seen
// when last scraped). Albums whose label opts out of previews still render fine;
// their tracks are simply not playable (no preview URL).
const ALBUM_IDS = [
  "19bQiwEKhXUBJWY6oV3KZk", // Madvillainy — Madvillain
  "4eLPsYPBmXABThSJ821sqY", // DAMN. — Kendrick Lamar
  "5SAhBlk4YQyyEFzoDrvRfP", // weight of the world — MIKE
  "3uFgYgCEvCSACjB8XHl3hb", // CASIOPEA — Casiopea
  "5ilsl5R2lGACTnPZMKIp7o", // All My Heroes Are Cornballs — JPEGMAFIA
  "3STQHyw2nOlIbb1FSgPse8", // OFFLINE! — JPEGMAFIA
  "6jfq0ndRJR396m0a6LpYIq", // The OOZ — King Krule
  "2soUHLxuGGYQCsGrt82HuB", // Man Alive! — King Krule
  "5bjUbZPVTEQcb6W3LquX1E", // Operation: Doomsday — MF DOOM
  "4euH5WAOsoYT660EFKhuCR", // Disco! — MIKE
  "4j8U3RLSad0x109PTuUDav", // Spanish Disco Deluxe — Leyya
  "5oSVYKZLKGCmwYqmJ7AZnO", // The Awakening — Ahmad Jamal Trio
  "5wtE5aLX5r7jOosmPhJhhk", // Swimming — Mac Miller
  "79dL7FLiJFOO0EoehUHQBv", // Currents — Tame Impala (replaced Nonagon Infinity: no previews)
  "2sJsyTO56RIPMrWmKV4908", // Quarters — King Gizzard (browse-only: label has no previews)
  "4m2880jivSbbyEGAKfITCa", // Random Access Memories — Daft Punk
];

// Spotify image hash prefixes encode the rendered size; the 24-char suffix is
// stable across sizes. i.scdn.co serves every size with `Access-Control-Allow-
// Origin: *`, which the client-side accent-color canvas extraction requires.
const SIZE_PREFIX = { 640: "ab67616d0000b273", 300: "ab67616d00001e02", 64: "ab67616d00004851" };

const imageSet = (anyImageUrl) => {
  const m = /\/image\/[0-9a-f]{16}([0-9a-f]{24})/.exec(anyImageUrl);
  if (!m) return [{ url: anyImageUrl }];
  const suffix = m[1];
  // Ordered largest-first to match the Spotify Web API: images[0]=640, [2]=64.
  return [640, 300, 64].map((size) => ({
    url: `https://i.scdn.co/image/${SIZE_PREFIX[size]}${suffix}`,
  }));
};

const fetchEntity = async (id) => {
  const res = await fetch(`https://open.spotify.com/embed/album/${id}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`embed ${id} -> HTTP ${res.status}`);
  const html = await res.text();
  const m = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s.exec(html);
  if (!m) throw new Error(`embed ${id} -> no __NEXT_DATA__`);
  return JSON.parse(m[1]).props.pageProps.state.data.entity;
};

const toAlbum = (id, e) => {
  const anyImage = e.visualIdentity?.image?.[0]?.url ?? "";
  return {
    id: e.id ?? id,
    name: e.title,
    artists: [{ name: e.subtitle }],
    images: imageSet(anyImage),
    songs: e.trackList.map((t) => ({
      id: t.uri?.split(":").pop() ?? "",
      title: t.title,
      artist: t.subtitle,
      duration: t.duration,
      album: e.title,
      listens: 0, // popularity isn't exposed via embed; UI hides zero.
      previewUrl: t.audioPreview?.url ?? null,
    })),
  };
};

const albums = [];
for (const id of ALBUM_IDS) {
  const album = toAlbum(id, await fetchEntity(id));
  const withPreview = album.songs.filter((s) => s.previewUrl).length;
  console.log(
    `${album.name.padEnd(32)} ${withPreview}/${album.songs.length} previews`,
  );
  albums.push(album);
}

const out = new URL("../src/data/albums.json", import.meta.url);
await writeFile(out, JSON.stringify(albums, null, 2) + "\n");
console.log(`\nWrote ${albums.length} albums to src/data/albums.json`);
