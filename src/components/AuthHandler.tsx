import { createEffect, createSignal, onMount } from "solid-js";
import { exchangeCodeForToken, login } from "./API";
import { LoaderCircle } from "lucide-solid";

export const [isAuthorizing, setIsAuthorizing] = createSignal(false);
export const [token, setToken] = createSignal("");
const AuthHandler = () => {
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const storedState = localStorage.getItem("spotifyAuthState");
    if (code && state && state === storedState) {
        exchangeCodeForToken(code);
    }
  });

createEffect(() => {
    if (isAuthorizing()) {
        console.log("Authorizing...");
        login();
        setIsAuthorizing(false);
    } else {
        console.log("Not Authorizing...");
    }
}, isAuthorizing());

  return (
    <>
      <div
        class={`absolute flex z-99 top-0 justify-center items-center w-full h-full bg-black bg-opacity-50`}
            style={{ visibility: isAuthorizing() ? "visible" : "hidden" }}
        >
        <div class="flex flex-col items-center gap-2 bg-slate-700 p-6 rounded-lg">
          <p class="text-white text-xl">Authorizing...</p>
          <LoaderCircle class="animate-spin" color="white"/>
        </div>
      </div>
    </>
  );
};

export default AuthHandler;
