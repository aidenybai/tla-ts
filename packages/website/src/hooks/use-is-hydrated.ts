import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => undefined;

export const useIsHydrated = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
