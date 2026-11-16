import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";

// An arrow bends only this close to the other pane, so it stays off the code on other lines.
const BEND_WIDTH_PX = 96;

interface Link {
  name: string;
  fromX: number;
  fromY: number;
  bendX: number;
  toX: number;
  toY: number;
}

interface Box {
  left: number;
  right: number;
  middle: number;
  isClipped: boolean;
}

interface ConnectorProps {
  names: string[];
  hoveredName: string | undefined;
  colors: Record<string, string>;
}

// A name points at its first row in view, so code that is linked twice still gets an arrow when
// its first use is scrolled away.
const getBoxes = (container: Element, paneName: string) => {
  const boxes = new Map<string, Box>();
  const pane = container.querySelector(`[data-pane="${paneName}"]`);
  const view = pane?.getBoundingClientRect();
  if (!pane || !view) return boxes;
  for (const element of pane.querySelectorAll<HTMLElement>("[data-region]")) {
    const name = element.dataset.region ?? "";
    const box = element.getBoundingClientRect();
    const middle = box.top + box.height / 2;
    const first = boxes.get(name);
    if (first) {
      if (first.middle === middle) {
        first.right = box.right;
        first.isClipped = box.right > view.right;
      }
    } else if (middle > view.top && box.bottom < view.bottom) {
      boxes.set(name, {
        left: element.parentElement?.parentElement?.getBoundingClientRect().left ?? box.left,
        right: box.right,
        middle,
        isClipped: box.right > view.right,
      });
    }
  }
  return boxes;
};

export const Connector = (props: ConnectorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const namesKey = props.names.join("\n");

  useLayoutEffect(() => {
    const container = svgRef.current?.parentElement;
    const names = namesKey === "" ? [] : namesKey.split("\n");
    if (!container || names.length === 0) return setLinks([]);
    const update = () => {
      const origin = container.getBoundingClientRect();
      const sources = getBoxes(container, "source");
      const outputs = getBoxes(container, "output");
      setLinks(
        names.flatMap((name) => {
          const source = sources.get(name);
          const output = outputs.get(name);
          return source && output && !source.isClipped
            ? {
                name,
                fromX: source.right - origin.left + 6,
                fromY: source.middle - origin.top,
                bendX: Math.max(
                  source.right - origin.left + 6,
                  output.left - origin.left + 10 - BEND_WIDTH_PX,
                ),
                toX: output.left - origin.left + 10,
                toY: output.middle - origin.top,
              }
            : [];
        }),
      );
    };
    update();
    const observer = new ResizeObserver(update);
    for (const element of container.querySelectorAll("[data-pane], [data-pane] > *"))
      observer.observe(element);
    const updateOnScroll = (event: Event) => {
      if (event.target instanceof Element && event.target.matches("[data-pane]")) update();
    };
    container.addEventListener("scroll", updateOnScroll, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", updateOnScroll, { capture: true });
    };
  }, [namesKey]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute inset-0 z-10 size-full overflow-hidden max-md:hidden"
    >
      {links.map((link) => (
        <g
          key={link.name}
          stroke={props.colors[link.name]}
          className={cn(
            "transition-opacity duration-150 ease-out",
            props.hoveredName !== undefined && props.hoveredName !== link.name && "opacity-15",
          )}
        >
          <path
            d={`M ${link.fromX} ${link.fromY} H ${link.bendX} C ${(link.bendX + link.toX) / 2} ${link.fromY}, ${(link.bendX + link.toX) / 2} ${link.toY}, ${link.toX} ${link.toY}`}
            strokeWidth="1.5"
          />
          <path
            d={`M ${link.toX - 4} ${link.toY - 2.5} L ${link.toX} ${link.toY} L ${link.toX - 4} ${link.toY + 2.5}`}
            strokeWidth="1.25"
          />
        </g>
      ))}
    </svg>
  );
};
