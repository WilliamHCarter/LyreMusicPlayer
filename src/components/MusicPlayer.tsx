import { createSignal, createEffect, Show } from "solid-js";
import { Play, Pause, SkipForward, SkipBack } from "lucide-solid";
import { getTrack, type Track } from "./API";
import { onMount } from "solid-js";

export const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);
  const [currentTrackId, setCurrentTrackId] = createSignal(
    "1nmxPH5RODwmPwfLOnyaAt"
  );
  const [currentTrack, setCurrentTrack] = createSignal<Track | null>(null);
  const [isConnected, setIsConnected] = createSignal(false);

  let player: Spotify.Player;

  onMount(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    if (isConnected()) {
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (window.Spotify) {
          player = new window.Spotify.Player({
            name: "Lyre",
            getOAuthToken: (callback: (token: string) => void) => {
              const token = "";
              callback(token);
            },
          });

          // Connect to the player
          player.connect();
        }
      };
    }
  });

  createEffect(async () => {
    try {
      const track = await getTrack(currentTrackId());
      setCurrentTrack(track);
    } catch (error) {
      console.error("Error fetching track:", error);
    }
  });

  const togglePlayPause = () => {
    if (isPlaying()) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.resume();
      setIsPlaying(true);
    }
  };

  const skipNext = () => player?.nextTrack();
  const skipPrevious = () => player?.previousTrack();

  return (
    <div class="relative w-[25vw] h-full bg-black flex items-center space-between">
      <div
        class="absolute inset-0 bg-cover bg-center blur-md opacity-50"
        style={{ "background-image": `url(${currentTrack()?.albumImage})` }}
      ></div>
      <div class="relative z-10 h-full flex items-center">
        <div
          class=" h-full aspect[1/1] overflow-hidden cursor-pointer hover:scale-100"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={togglePlayPause}
        >
          <img
            src={currentTrack()?.albumImage}
            alt="Album Cover"
            class="w-full h-full object-cover"
          />
          <Show when={isHovered()}>
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              {isPlaying() ? (
                <Pause class="text-white text-4xl" fill="white" size={18} />
              ) : (
                <Play class="text-white text-4xl " fill="white" size={18} />
              )}
            </div>
          </Show>
        </div>
        <div class="text-white flex flex-col justify-center h-full pl-4 py-1 w-[10vw] bg-[#ffffff30]">
          <div class="text-[10px] opacity-70 leading-tight">
            {currentTrack()?.artistName} - {currentTrack()?.albumName}
          </div>
          <div class="text-md font-semibold mt-0 leading-tight">
            {currentTrack()?.songName}
          </div>
        </div>
      </div>
      <div class="absolute right-4 flex items-center space-x-4">
        <SkipBack
          class="text-white cursor-pointer"
          fill="white"
          size={18}
          onClick={() => skipNext()}
        />
        <SkipForward
          class="text-white cursor-pointer"
          fill="white"
          size={18}
          onClick={() => skipPrevious()}
        />
      </div>
    </div>
  );
};
