import { useLayoutEffect, useState, type RefObject } from "react";
import type { Mark } from "@/lib/marks";
import { createLineLookup, getLinesBox, getRangeRows, type Box } from "@/lib/positions";

export interface PlacedToken {
  mark: Mark;
  // The text the mark covers, one box per visual row.
  rows: Box[];
  // The full width and height of the lines the mark covers.
  lines: Box;
}

const measure = (wrapper: HTMLElement, marks: Mark[]): PlacedToken[] => {
  const host = wrapper.querySelector<HTMLElement>("diffs-container");
  if (!host) return [];
  const lookup = createLineLookup(host, wrapper);
  return marks.flatMap((mark) => {
    const loc = mark.nodes[0].loc;
    const lines = getLinesBox(lookup, loc);
    return lines && lines.height > 0 ? [{ mark, rows: getRangeRows(lookup, loc), lines }] : [];
  });
};

export const useTokenBoxes = (
  wrapperRef: RefObject<HTMLElement | null>,
  marks: Mark[],
  renderCount: number,
): PlacedToken[] => {
  const [tokens, setTokens] = useState<PlacedToken[]>([]);
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const update = (): void => setTokens(measure(wrapper, marks));
    update();
    document.fonts.ready.then(update);
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [wrapperRef, marks, renderCount]);
  return tokens;
};
