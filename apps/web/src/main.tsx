import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import api from "./lib/api";
import { setupAuthInterceptors } from "./lib/auth/axios-interceptors";
import { useAuthStore } from "./features/auth/auth.store";
import "./index.css";

// Wire up the 401-retry interceptor once, before any API call can happen.
setupAuthInterceptors(api, () => useAuthStore.getState());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
