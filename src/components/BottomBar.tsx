import {
  type Component,
  createEffect,
  createSignal,
  onMount,
  For,
} from "solid-js";
import { CircleUserRound, Search, ListMusic } from "lucide-solid";
import { MusicPlayer } from "./MusicPlayer";
import AuthHandler, { setIsAuthorizing } from "./AuthHandler";
import { entranceDone } from "./spines";

const BottomBar: Component = () => {
  const [activeTab, setActiveTab] = createSignal("Home");
  const [loggedIn, setLoggedIn] = createSignal(false);

  onMount(() => {
    setLoggedIn(!!localStorage.getItem("spotifyAccessToken"));
  });
  const [transform, setTransform] = createSignal("translateY(100%)");

  const tabs = ["Home", "Library", "Albums", "Podcasts"];

  // Slide up when the album-shelf entrance actually finishes (entranceDone is
  // set by spines.tsx) instead of a hardcoded timeout racing the data fetch.
  createEffect(() => {
    if (entranceDone()) setTransform("translateY(0)");
  });

  return (
    <div
      class="fixed bottom-0 left-0 right-0 z-10 h-12 bg-[#020202] flex items-center justify-between scrollbar-hide"
      style={{
        transform: transform(),
        transition: `transform 0.4s ease-in-out`,
      }}
    >
      <div class="flex items-center justify-start h-full">
        {/* Account Section */}
        <button
          type="button"
          aria-label={loggedIn() ? "Account" : "Log in with Spotify"}
          class="flex items-center px-2 gap-2 cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={() => setIsAuthorizing(true)}
        >
          <CircleUserRound class="text-white mr-2" aria-hidden="true" />
          <span class="hidden sm:inline text-white">
            {loggedIn() ? "Account" : "Log In"}
          </span>
        </button>

        {/* Search Section (not implemented yet — visibly disabled) */}
        <div
          class="hidden sm:flex justify-between items-center h-full bg-[#222] px-4 max-w-[30vw] w-[25vw] opacity-50"
          title="Coming soon"
        >
          <input
            type="text"
            placeholder="Search"
            disabled
            aria-disabled="true"
            title="Coming soon"
            class="bg-[#222] text-white py-0 cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
          <Search class=" text-white py-[0.1rem] " aria-hidden="true" />
        </div>
        <Search
          class="inline sm:hidden text-white py-[0.1rem] opacity-50"
          aria-hidden="true"
        />
      </div>

      {/* Tabs Section (only Home is functional for now) */}
      <div class="hidden sm:flex justify-start flex-grow px-4">
        <div class="flex items-center justify-between w-full">
          <div>
            <For each={tabs}>
              {(tab) => (
                <button
                  type="button"
                  disabled={tab !== "Home"}
                  aria-disabled={tab !== "Home"}
                  title={tab !== "Home" ? "Coming soon" : undefined}
                  aria-current={activeTab() === tab ? "true" : undefined}
                  class={`text-white px-4 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    activeTab() === tab ? "border-b-2 border-white" : ""
                  } ${tab !== "Home" ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              )}
            </For>
          </div>
          <ListMusic class="text-white opacity-50" aria-hidden="true" />
        </div>
      </div>
      <ListMusic
        class="inline sm:hidden text-white opacity-50"
        aria-hidden="true"
      />

      {/* Player Section */}
      <MusicPlayer />
      <AuthHandler />
    </div>
  );
};

export default BottomBar;
