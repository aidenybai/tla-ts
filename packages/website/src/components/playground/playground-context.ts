import { createContext, use, type RefObject } from "react";
import type { Example } from "../../examples";
import type { useCheck } from "../../hooks/use-check";

interface PlaygroundContextValue {
  example: Example;
  exampleIndex: number;
  isResultShown: boolean;
  specRef: RefObject<string>;
  configRef: RefObject<string>;
  check: ReturnType<typeof useCheck>;
  setIsResultShown: (isResultShown: boolean) => void;
  selectExample: (index: number) => void;
  runCheck: () => void;
}

export const PlaygroundContext = createContext<PlaygroundContextValue | undefined>(undefined);

export const usePlayground = () => {
  const context = use(PlaygroundContext);
  if (context === undefined) throw new Error("Playground parts must render inside Playground.Root");
  return context;
};
