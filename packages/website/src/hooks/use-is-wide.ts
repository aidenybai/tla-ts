import { useSyncExternalStore } from "react";

// Tailwind's lg breakpoint, where the playground sits beside the intro instead of below it.
const WIDE_QUERY = "(min-width: 1024px)";

export const useIsWide = () =>
  useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(WIDE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => matchMedia(WIDE_QUERY).matches,
  );
