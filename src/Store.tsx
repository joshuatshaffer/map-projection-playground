import { useSyncExternalStore } from "react";

export type Store<T> = ReturnType<typeof makeStore<T>>;

export function makeStore<T>(initialState: T | (() => T)) {
  const listeners = new Set<(state: T) => void>();

  let state =
    typeof initialState === "function"
      ? (initialState as () => T)()
      : initialState;

  return {
    subscribe: (listener: (state: T) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setState: (update: T | ((prev: T) => T)) => {
      const newState =
        typeof update === "function"
          ? (update as (prev: T) => T)(state)
          : update;

      if (newState === state) {
        return;
      }

      state = newState;

      for (const listener of listeners) {
        listener(state);
      }
    },

    getState: () => state,
  };
}

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.getState);
}
