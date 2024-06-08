import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import {type Component } from "solid-js";
import Spines from "./spines";

const queryClient = new QueryClient();

export const TanstackWrapper: Component = () => {
    return (
    <QueryClientProvider client={queryClient}>
      <Spines />
    </QueryClientProvider>
  );
};