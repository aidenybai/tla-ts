import { useState } from "react";

const COPIED_MS = 1500;

export const useCopy = (text: string) => {
  const [isCopied, setIsCopied] = useState(false);
  return {
    isCopied,
    copy: async () => {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPIED_MS);
    },
  };
};
