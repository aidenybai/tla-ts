import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";

// An arrow bends only this close to the other pane, so it stays off the code on other lines.
const BEND_WIDTH_PX = 96;
const HEAD_LENGTH_PX = 4;

interface Link {
  name: string;
  fromX: number;
  fromY: number;
  bendX: number;
  toX: number;
  toY: number;
  headAngle: number;
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

// A steep curve has left its level end tangent well before the head, so the head takes the
// direction the curve has one head length back.
const getHeadAngle = (bendX: number, fromY: number, toX: number, toY: number) => {
  const middleX = (bendX + toX) / 2;
  for (let progress = 0.99; progress > 0; progress -= 0.01) {
    const rest = 1 - progress;
    const backX =
      toX -
      (rest ** 3 * bendX + 3 * rest * progress * middleX * (rest + progress) + progress ** 3 * toX);
    const backY =
      toY -
      (rest ** 3 * fromY +
        3 * rest ** 2 * progress * fromY +
        3 * rest * progress ** 2 * toY +
        progress ** 3 * toY);
    if (Math.hypot(backX, backY) >= HEAD_LENGTH_PX)
      return (Math.atan2(backY, backX) * 180) / Math.PI;
  }
  return 0;
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
          if (!source || !output || source.isClipped) return [];
          const fromX = source.right - origin.left + 6;
          const fromY = source.middle - origin.top;
          const toX = output.left - origin.left + 10;
          const toY = output.middle - origin.top;
          const bendX = Math.max(fromX, toX - BEND_WIDTH_PX);
          return {
            name,
            fromX,
            fromY,
            bendX,
            toX,
            toY,
            headAngle: getHeadAngle(bendX, fromY, toX, toY),
          };
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
            "transition-opacity duration-150 ease-out starting:opacity-0",
            props.hoveredName !== undefined && props.hoveredName !== link.name && "opacity-15",
          )}
        >
          <path
            d={`M ${link.fromX} ${link.fromY} H ${link.bendX} C ${(link.bendX + link.toX) / 2} ${link.fromY}, ${(link.bendX + link.toX) / 2} ${link.toY}, ${link.toX} ${link.toY}`}
            strokeWidth="1.5"
          />
          <path
            d={`M ${-HEAD_LENGTH_PX} -2.5 L 0 0 L ${-HEAD_LENGTH_PX} 2.5`}
            transform={`translate(${link.toX} ${link.toY}) rotate(${link.headAngle})`}
            strokeWidth="1.25"
          />
        </g>
      ))}
    </svg>
  );
};
