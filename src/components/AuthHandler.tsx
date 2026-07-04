import { createEffect, createSignal, onMount } from "solid-js";
import { exchangeCodeForToken, login } from "./API";
import { LoaderCircle } from "lucide-solid";
import { createMutation } from "@tanstack/solid-query";

export const [isAuthorizing, setIsAuthorizing] = createSignal(false);

const AuthHandler = () => {
  const exchangeCodeForTokenMutation = createMutation(() => ({
    mutationFn: (code: string) => exchangeCodeForToken(code),
  }));

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const storedState = localStorage.getItem("spotifyAuthState");
    if (code && state && state === storedState) {
      localStorage.removeItem("spotifyAuthState");
      urlParams.delete("code");
      urlParams.delete("state");
      const query = urlParams.toString();
      history.replaceState(
        null,
        "",
        window.location.pathname + (query ? `?${query}` : ""),
      );
      exchangeCodeForTokenMutation.mutate(code);
    }
  });

  createEffect(() => {
    if (isAuthorizing()) {
      login();
      setIsAuthorizing(false);
    }
  });

  return (
    <div
      class="fixed inset-0 z-[99] flex justify-center items-center bg-black bg-opacity-50"
      style={{
        visibility: exchangeCodeForTokenMutation.isPending
          ? "visible"
          : "hidden",
      }}
      role="dialog"
      aria-live="polite"
    >
      <div class="flex flex-col items-center gap-2 bg-slate-700 p-6 rounded-lg">
        <p class="text-white text-xl">Authorizing...</p>
        <LoaderCircle class="animate-spin" color="white" />
      </div>
    </div>
  );
};

export default AuthHandler;
