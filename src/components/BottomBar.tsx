import { type Component, createSignal } from "solid-js";
import {
  CircleUserRound,
  Search,
  Music,
  ListMusic,
  ChevronDown,
} from "lucide-solid";
import { MusicPlayer } from "./MusicPlayer";

interface BottomBarProps {
  albumCover: string;
  miniCover: string;
  albumName: string;
  artistName: string;
}

const BottomBar: Component<BottomBarProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal("Home");
  const [transform, setTransform] = createSignal("translateY(100%)");

  const tabs = ["Home", "Library", "Albums", "Podcasts"];
  
setTimeout(() => {
    setTransform("translateY(0)");
}, 1450);

return (
    <div
      class="fixed bottom-0 left-0 right-0 z-10 h-12 bg-[#020202] flex items-center justify-between "
      style={{ transform: transform(), transition: `transform 0.4s ease-in-out` }}
    >
      <div class="flex items-center justify-start h-full">
        {/* Account Section */}
        <div class="flex items-center px-2 gap-2">
          <CircleUserRound class="text-white mr-2" />
          <span class="text-white">Log In</span>
          <ChevronDown class="text-white ml-8" />
        </div>

        {/* Search Section */}
        <div class="flex justify-between items-center h-full bg-[#222] px-4 maxW-[30vw] w-[25vw]">
          <input
            type="text"
            placeholder="Search"
            class="bg-[#222] text-white py-0 focus:outline-none"
          />
          <Search class=" text-white py-[0.1rem] " />
        </div>
      </div>

      {/* Tabs Section */}
      <div class="flex justify-start p-auto flex-grow px-4">
        <div class="flex items-center justify-between w-full">
          <div>
            {tabs.map((tab) => (
              <button
                class={`text-white px-4 py-1 ${
                  activeTab() === tab ? "border-b-2 border-white" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <ListMusic class="text-white" />
        </div>
      </div>

      {/* Player Section */}
      <MusicPlayer />
    </div>
  );
};

export default BottomBar;
