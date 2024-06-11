import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { type Component } from "solid-js";
import Spines from "./spines";
import BottomBar from "./BottomBar";

const queryClient = new QueryClient();

export const TanstackWrapper: Component = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Spines />
      <BottomBar
        albumCover={"albumCover"}
        miniCover={"miniCover"}
        albumName={"albumName"}
        artistName={"artistName"}
      />
    </QueryClientProvider>
  );
};
