import { useId, useLayoutEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface Link {
  from: Point;
  to: Point;
}

interface ConnectorProps {
  name: string | undefined;
  color: string | undefined;
}

const getBox = (container: Element, name: string) => {
  const pane = container.querySelector(`[data-pane="${name}"]`);
  const elements = [...(pane?.querySelectorAll("[data-linked]") ?? [])];
  const boxes = elements.map((element) => element.getBoundingClientRect());
  const view = pane?.getBoundingClientRect();
  const middle = boxes.length === 0 ? 0 : boxes[0].top + boxes[0].height / 2;
  return view === undefined || middle < view.top || middle > view.bottom
    ? undefined
    : {
        left:
          elements[0].parentElement?.parentElement?.getBoundingClientRect().left ?? boxes[0].left,
        right: Math.max(...boxes.filter((box) => box.top === boxes[0].top).map((box) => box.right)),
        middle,
      };
};

export const Connector = (props: ConnectorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = useId();
  const [link, setLink] = useState<Link | undefined>(undefined);

  useLayoutEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container || props.name === undefined) return setLink(undefined);
    const update = () => {
      const origin = container.getBoundingClientRect();
      const source = getBox(container, "source");
      const output = getBox(container, "output");
      setLink(
        source && output
          ? {
              from: { x: source.right - origin.left + 6, y: source.middle - origin.top },
              to: { x: output.left - origin.left + 10, y: output.middle - origin.top },
            }
          : undefined,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    for (const content of container.querySelectorAll("[data-pane] > *")) observer.observe(content);
    container.addEventListener("scroll", update, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", update, { capture: true });
    };
  }, [props.name]);

  const middle = link ? (link.from.x + link.to.x) / 2 : 0;
  return (
    <svg
      ref={svgRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 size-full overflow-hidden max-md:hidden"
    >
      <marker
        id={markerId}
        viewBox="0 0 8 8"
        refX="6"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path
          d="M1.5 1.5 6 4 1.5 6.5"
          fill="none"
          stroke={props.color}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </marker>
      {link && (
        <path
          d={`M ${link.from.x} ${link.from.y} C ${middle} ${link.from.y}, ${middle} ${link.to.y}, ${link.to.x} ${link.to.y}`}
          fill="none"
          stroke={props.color}
          strokeWidth="1.5"
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      )}
    </svg>
  );
};
