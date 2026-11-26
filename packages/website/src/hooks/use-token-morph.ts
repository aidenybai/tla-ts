import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const MORPH_DURATION_MS = 600;
const RESIZE_DURATION_MS = 300;
const RESIZE_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
const HIGHLIGHT_DURATION_MS = 1400;
const FADE_DURATION_MS = 300;
// The old code leaves before the new code enters, so the two are never on screen together.
const LEAVE_DURATION_MS = 150;
const ENTER_DELAY_MS = 300;
const EASING = "cubic-bezier(0.645, 0.045, 0.355, 1)";

interface TokenSnapshot {
  element: HTMLElement;
  text: string;
  isComment: boolean;
  left: number;
  top: number;
}

interface CodeSnapshot {
  code: string;
  tokens: TokenSnapshot[];
  height: number;
  width: number;
  moreLineCount: number;
}

const getTokenSnapshots = (container: HTMLElement): TokenSnapshot[] => {
  const origin = container.getBoundingClientRect();
  // The lines that the reader opened past the code's start take no part in a morph, and measuring
  // hundreds of them on each change would be slow.
  return [
    ...container.querySelectorAll<HTMLElement>(":scope > :not([data-more]) [data-token]"),
  ].map((element) => {
    const box = element.getBoundingClientRect();
    return {
      element,
      text: element.textContent,
      isComment: element.closest("[data-comment]") !== null,
      left: box.left - origin.left,
      top: box.top - origin.top,
    };
  });
};

const getMoreLineCount = (container: HTMLElement) =>
  container.querySelector(":scope > [data-more]")?.childElementCount ?? 0;

// JS.tla's code shares words with its TypeScript only by chance, and its comments quote the
// TypeScript. So where code has comments, only their tokens match.
const getMatchTexts = (tokens: TokenSnapshot[]) => {
  const hasComments = tokens.some((token) => token.isComment);
  return tokens.map((token, index) =>
    hasComments && !token.isComment ? `\n${index}` : token.text,
  );
};

const getMatches = (before: string[], after: string[]) => {
  const width = after.length + 1;
  const lengths = new Uint16Array((before.length + 1) * width);
  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex--) {
    for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex--) {
      lengths[beforeIndex * width + afterIndex] =
        before[beforeIndex] === after[afterIndex]
          ? lengths[(beforeIndex + 1) * width + afterIndex + 1] + 1
          : Math.max(
              lengths[(beforeIndex + 1) * width + afterIndex],
              lengths[beforeIndex * width + afterIndex + 1],
            );
    }
  }
  const matches = new Map<number, number>();
  let beforeIndex = 0;
  let afterIndex = 0;
  while (beforeIndex < before.length && afterIndex < after.length) {
    if (before[beforeIndex] === after[afterIndex]) {
      matches.set(afterIndex++, beforeIndex++);
    } else if (
      lengths[(beforeIndex + 1) * width + afterIndex] >=
      lengths[beforeIndex * width + afterIndex + 1]
    ) {
      beforeIndex++;
    } else {
      afterIndex++;
    }
  }
  return matches;
};

const highlight = (element: HTMLElement, color: string, delay: number) => {
  const tint = `color-mix(in srgb, ${color} 24%, transparent)`;
  const shown = { backgroundColor: tint, boxShadow: `2px 0 0 ${tint}, -2px 0 0 ${tint}` };
  const hidden = {
    backgroundColor: "transparent",
    boxShadow: "2px 0 0 transparent, -2px 0 0 transparent",
  };
  element.animate([hidden, { ...shown, offset: 0.15 }, { ...shown, offset: 0.75 }, hidden], {
    duration: HIGHLIGHT_DURATION_MS,
    delay,
    easing: "ease-out",
  });
};

export const useTokenMorph = (
  containerRef: RefObject<HTMLElement | null>,
  code: string,
  colors: Record<string, string>,
) => {
  const snapshotRef = useRef<CodeSnapshot | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const observer = new ResizeObserver(() => {
      const snapshot = snapshotRef.current;
      if (snapshot === undefined || container.getAnimations().length > 0) return;
      const height = container.offsetHeight;
      const width = container.offsetWidth;
      const moreLineCount = getMoreLineCount(container);
      snapshotRef.current = {
        code: snapshot.code,
        tokens: getTokenSnapshots(container),
        height,
        width,
        moreLineCount,
      };
      // States come and go without a change of code, so the morph below never sees them. Lines
      // that the reader opens come in hundreds, and a height that eased would lay them out anew
      // on every frame.
      if (
        height !== snapshot.height &&
        width === snapshot.width &&
        moreLineCount === snapshot.moreLineCount &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        container.animate([{ height: `${snapshot.height}px` }, { height: `${height}px` }], {
          duration: RESIZE_DURATION_MS,
          easing: RESIZE_EASING,
        });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const before = snapshotRef.current;
    const tokens = getTokenSnapshots(container);
    const height = container.offsetHeight;
    snapshotRef.current = {
      code,
      tokens,
      height,
      width: container.offsetWidth,
      moreLineCount: getMoreLineCount(container),
    };
    if (before === undefined || before.code === code) return;

    const isReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const matches = getMatches(getMatchTexts(before.tokens), getMatchTexts(tokens));
    tokens.forEach((token, index) => {
      const matched = before.tokens[matches.get(index) ?? -1];
      const color = colors[token.element.dataset.region ?? ""];
      if (color !== undefined) highlight(token.element, color, isReduced ? 0 : MORPH_DURATION_MS);
      if (matched === undefined || isReduced)
        token.element.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: FADE_DURATION_MS,
          delay: isReduced ? 0 : ENTER_DELAY_MS,
          fill: "backwards",
          easing: "ease-out",
        });
      else
        token.element.animate(
          [
            {
              transform: `translate(${matched.left - token.left}px, ${matched.top - token.top}px)`,
            },
            { transform: "none" },
          ],
          { duration: MORPH_DURATION_MS, easing: EASING },
        );
    });
    if (isReduced) return;

    // The new code has its full height from the start, so it would lie over what is below it.
    container.animate(
      [
        { height: `${before.height}px`, overflowY: "clip" },
        { height: `${height}px`, overflowY: "clip" },
      ],
      { duration: MORPH_DURATION_MS, easing: EASING },
    );
    const leaving = new Set(before.tokens.keys()).difference(new Set(matches.values()));
    const ghosts = document.createElement("span");
    ghosts.ariaHidden = "true";
    ghosts.className = "pointer-events-none absolute inset-0";
    for (const index of leaving) {
      const token = before.tokens[index];
      const ghost = document.createElement("span");
      ghost.textContent = token.text;
      ghost.className = token.element.className;
      ghost.style.cssText = `${token.element.style.cssText};position:absolute;left:${token.left}px;top:${token.top}px`;
      ghosts.append(ghost);
    }
    container.append(ghosts);
    ghosts.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: LEAVE_DURATION_MS,
      easing: "ease-out",
      fill: "forwards",
    }).onfinish = () => ghosts.remove();
  }, [containerRef, code, colors]);
};
