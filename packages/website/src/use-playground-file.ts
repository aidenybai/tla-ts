import { useLayoutEffect, useState } from "react";
import { PLAYGROUND_EXAMPLES } from "./playground-examples";

// The file in the editor: an example, or the code a link carries in its hash.
export const usePlaygroundFile = () => {
  const [file, setFile] = useState(PLAYGROUND_EXAMPLES[0]);
  // Before the first paint after hydration, so the file a link names replaces the built one unseen.
  useLayoutEffect(() => {
    const shared = new URLSearchParams(location.hash.slice(1));
    const fileName = shared.get("file") ?? "example.ts";
    const source =
      shared.get("code") ??
      PLAYGROUND_EXAMPLES.find((example) => example.fileName === fileName)?.source;
    if (source !== undefined) setFile({ fileName, source });
    delete document.documentElement.dataset.shared;
  }, []);
  return {
    fileName: file.fileName,
    source: file.source,
    edit: (source: string) => setFile({ fileName: file.fileName, source }),
    select: (fileName: string) => {
      history.replaceState(null, "", `#${new URLSearchParams({ file: fileName })}`);
      setFile(PLAYGROUND_EXAMPLES.find((example) => example.fileName === fileName) ?? file);
    },
  };
};
