import { create } from "zustand";
import { sessionApi } from "../api/endpoints";

export const useSessionStore = create((set, get) => ({
  preloadedSession: null,
  preloadPromise: null,

  preloadSession: async () => {
    // If we already have a session, return it
    if (get().preloadedSession) return get().preloadedSession;
    
    // If we are already preloading, wait for that to finish
    if (get().preloadPromise) return get().preloadPromise;

    // Start a new preload
    const promise = sessionApi.startSession().then(res => {
      set({ preloadedSession: res.data, preloadPromise: null });
      return res.data;
    }).catch(err => {
      set({ preloadPromise: null });
      throw err;
    });

    set({ preloadPromise: promise });
    return promise;
  },

  consumeSession: () => {
    const session = get().preloadedSession;
    // Clear it so it can't be reused for a second assessment
    set({ preloadedSession: null, preloadPromise: null });
    return session;
  },

  clearSession: () => {
    set({ preloadedSession: null, preloadPromise: null });
  }
}));
