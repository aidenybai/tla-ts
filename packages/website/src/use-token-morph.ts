import { useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from "react";

const MORPH_DURATION_MS = 600;
const RESIZE_DURATION_MS = 300;
const RESIZE_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
const HIGHLIGHT_DURATION_MS = 1400;
const FADE_DURATION_MS = 300;
const ENTER_DELAY_MS = 150;
const EASING = "cubic-bezier(0.645, 0.045, 0.355, 1)";

interface TokenSnapshot {
  element: HTMLElement;
  text: string;
  left: number;
  top: number;
}

interface CodeSnapshot {
  code: string;
  tokens: TokenSnapshot[];
  height: number;
  width: number;
}

const getTokenSnapshots = (container: HTMLElement): TokenSnapshot[] => {
  const origin = container.getBoundingClientRect();
  return [...container.querySelectorAll<HTMLElement>("[data-token]")].map((element) => {
    const box = element.getBoundingClientRect();
    return {
      element,
      text: element.textContent,
      left: box.left - origin.left,
      top: box.top - origin.top,
    };
  });
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

const highlight = (element: HTMLElement, color: string) => {
  const tint = `color-mix(in srgb, ${color} 24%, transparent)`;
  const shown = { backgroundColor: tint, boxShadow: `2px 0 0 ${tint}, -2px 0 0 ${tint}` };
  const hidden = {
    backgroundColor: "transparent",
    boxShadow: "2px 0 0 transparent, -2px 0 0 transparent",
  };
  element.animate([hidden, { ...shown, offset: 0.15 }, { ...shown, offset: 0.75 }, hidden], {
    duration: HIGHLIGHT_DURATION_MS,
    easing: "ease-out",
  });
};

export const useTokenMorph = (
  containerRef: RefObject<HTMLElement | null>,
  code: string,
  highlights: Record<string, string>,
  onFinish: (() => void) | undefined,
) => {
  const snapshotRef = useRef<CodeSnapshot | undefined>(undefined);
  const finish = useEffectEvent(() => onFinish?.());

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const observer = new ResizeObserver(() => {
      const snapshot = snapshotRef.current;
      if (snapshot === undefined || container.getAnimations().length > 0) return;
      const height = container.offsetHeight;
      const width = container.offsetWidth;
      snapshotRef.current = {
        code: snapshot.code,
        tokens: getTokenSnapshots(container),
        height,
        width,
      };
      // States come and go without a change of code, so the morph below never sees them.
      if (
        height !== snapshot.height &&
        width === snapshot.width &&
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
    snapshotRef.current = { code, tokens, height, width: container.offsetWidth };
    if (before === undefined || before.code === code) return;

    const isReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const matches = getMatches(
      before.tokens.map((token) => token.text),
      tokens.map((token) => token.text),
    );
    const animations = tokens.map((token, index) => {
      const matched = before.tokens[matches.get(index) ?? -1];
      const color = highlights[token.text];
      if (color !== undefined) highlight(token.element, color);
      if (matched === undefined || isReduced)
        return token.element.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: FADE_DURATION_MS,
          delay: isReduced ? 0 : ENTER_DELAY_MS,
          fill: "backwards",
          easing: "ease-out",
        });
      return token.element.animate(
        [
          {
            transform: `translate(${matched.left - token.left}px, ${matched.top - token.top}px)`,
          },
          { transform: "none" },
        ],
        { duration: MORPH_DURATION_MS, easing: EASING },
      );
    });
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
    if (isReduced) return;

    container.animate([{ height: `${before.height}px` }, { height: `${height}px` }], {
      duration: MORPH_DURATION_MS,
      easing: EASING,
    });
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
      duration: FADE_DURATION_MS,
      easing: "ease-out",
      fill: "forwards",
    }).onfinish = () => ghosts.remove();
  }, [containerRef, code, highlights]);
};
