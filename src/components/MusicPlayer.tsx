import { createSignal, Show, onMount } from "solid-js";
import { Play, Pause, SkipForward, SkipBack } from "lucide-solid";
import { getUserToken, type Track } from "./API";

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";

let player: Spotify.Player | undefined;
let playerReadyPromise: Promise<Spotify.Player> | null = null;

// Creates the player and connects it, injecting the SDK script at most once.
// The player is only constructed inside onSpotifyWebPlaybackSDKReady, so the
// old race (onMount running before the SDK callback fired) is gone.
const initPlayer = (): Promise<Spotify.Player> => {
  if (playerReadyPromise) {
    return playerReadyPromise;
  }

  playerReadyPromise = new Promise<Spotify.Player>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify!.Player({
        name: "Lyre Music Player",
        getOAuthToken: (callback: (token: string) => void) => {
          getUserToken().then((token) => {
            if (token) {
              callback(token);
            }
          });
        },
        volume: 0.5,
      });
      player = p;
      p.connect()
        .then(() => resolve(p))
        .catch((error) => reject(error));
    };

    if (document.querySelector(`script[src="${SDK_URL}"]`)) {
      // Script already injected; if the SDK is loaded, run the callback now.
      if (window.Spotify) {
        window.onSpotifyWebPlaybackSDKReady();
      }
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.addEventListener("error", () => {
      reject(new Error("Failed to load the Spotify SDK"));
    });
    document.body.appendChild(script);
  });

  return playerReadyPromise;
};

export const MusicPlayer = () => {
  const [playerError, setPlayerError] = createSignal<string | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [currentTrack, setCurrentTrack] = createSignal<Track | null>(null);

  onMount(async () => {
    // Logged-out visitors get no SDK script, no player, and no track fetch.
    const token = await getUserToken();
    if (!token) {
      return;
    }
    setIsLoggedIn(true);

    try {
      const p = await initPlayer();

      p.addListener("initialization_error", () => {
        setPlayerError("Failed to initialize player");
      });
      p.addListener("authentication_error", () => {
        setPlayerError("Authentication failed");
      });
      p.addListener("account_error", () => {
        setPlayerError("Spotify Premium is required to play music");
      });

      const onStateChange = (state: Spotify.PlaybackState | null) => {
        if (!state) {
          setIsPlaying(false);
          return;
        }
        setIsPlaying(!state.paused);
        const track = state.track_window.current_track;
        if (track) {
          setCurrentTrack({
            id: track.id ?? "",
            albumImage: track.album.images[0]?.url ?? "",
            artistName: track.artists[0]?.name ?? "",
            albumName: track.album.name,
            songName: track.name,
          });
        }
      };
      // env.d.ts (owned by another track) types listener callbacks as
      // () => void; cast so the state payload can be received.
      p.addListener(
        "player_state_changed",
        onStateChange as unknown as () => void,
      );
    } catch (error) {
      setPlayerError(`Player initialization failed: ${error}`);
    }
  });

  const togglePlayPause = () => {
    if (player) {
      player.getCurrentState().then((state) => {
        if (!state) {
          setPlayerError("Start playback from Spotify to control it here");
          return;
        }
        if (state.paused) {
          player?.resume();
        } else {
          player?.pause();
        }
      });
    }
  };

  const skipNext = () => {
    player?.nextTrack();
  };

  const skipPrevious = () => {
    player?.previousTrack();
  };

  return (
    <div class="relative w-[65vw] sm:w-[25vw] h-full bg-black flex items-center justify-between">
      <Show
        when={isLoggedIn()}
        fallback={
          <div class="relative z-10 flex items-center h-full px-4 text-white text-sm opacity-70">
            Log in to play
          </div>
        }
      >
        <div
          class="absolute inset-0 bg-cover bg-center blur-md opacity-50"
          style={{
            "background-image": currentTrack()
              ? `url(${currentTrack()!.albumImage})`
              : "none",
          }}
        ></div>
        <div class="relative z-10 h-full flex items-center">
          <button
            type="button"
            aria-label={isPlaying() ? "Pause" : "Play"}
            class="relative h-full aspect-square overflow-hidden cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={togglePlayPause}
          >
            <img
              src={currentTrack()?.albumImage}
              alt="Album Cover"
              class="w-full h-full object-cover"
            />
            <Show when={!isPlaying() || isHovered()}>
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                {isPlaying() ? (
                  <Pause class="text-white" fill="white" size={18} />
                ) : (
                  <Play class="text-white" fill="white" size={18} />
                )}
              </div>
            </Show>
          </button>
          <div class="text-white flex flex-col justify-center h-full pl-4 py-1 w-[33vw] sm:w-[10vw] bg-[#ffffff30]">
            <Show
              when={currentTrack()}
              fallback={
                <div class="text-[10px] opacity-70 leading-tight">
                  Nothing playing
                </div>
              }
            >
              <div class="text-[10px] opacity-70 leading-tight">
                {currentTrack()?.artistName} - {currentTrack()?.albumName}
              </div>
              <div class="text-md font-semibold mt-0 leading-tight">
                {currentTrack()?.songName}
              </div>
            </Show>
            <Show when={playerError()}>
              <div class="text-[10px] text-red-400 leading-tight" role="alert">
                {playerError()}
              </div>
            </Show>
          </div>
        </div>
        <div class="absolute right-4 flex items-center space-x-4 z-10">
          <button
            type="button"
            aria-label="Previous track"
            class="text-white cursor-pointer"
            onClick={skipPrevious}
          >
            <SkipBack fill="white" size={18} />
          </button>
          <button
            type="button"
            aria-label="Next track"
            class="text-white cursor-pointer"
            onClick={skipNext}
          >
            <SkipForward fill="white" size={18} />
          </button>
        </div>
      </Show>
    </div>
  );
};
