export interface Span {
  top: number;
  bottom: number;
}

export interface RibbonEnd extends Span {
  // True when the span is scrolled out of its pane, so the end pinches to the pane's edge.
  isPinned: boolean;
}

export interface RibbonPaths {
  fill: string;
  top: string;
  bottom: string;
}

// Clamps a span to the visible part of its pane, on whole pixels.
export const clampSpan = (span: Span, view: Span): RibbonEnd => {
  const clamp = (y: number) => Math.round(Math.min(Math.max(y, view.top), view.bottom));
  const top = clamp(span.top);
  const bottom = clamp(span.bottom);
  return { top, bottom, isPinned: bottom - top < 1 };
};

// A ribbon from a span on the left edge of the gutter to a span on its right edge, like the
// connectors of a side-by-side diff. Its top and bottom are cubic curves that leave and meet both
// edges horizontally. The strokes sit half a pixel inside the fill, so they stay crisp.
export const getRibbonPaths = (from: Span, to: Span, width: number): RibbonPaths => {
  const middle = width / 2;
  const getCurve = (left: number, right: number) =>
    `M 0 ${left} C ${middle} ${left}, ${middle} ${right}, ${width} ${right}`;
  return {
    fill: `${getCurve(from.top, to.top)} L ${width} ${to.bottom} C ${middle} ${to.bottom}, ${middle} ${from.bottom}, 0 ${from.bottom} Z`,
    top: getCurve(from.top + 0.5, to.top + 0.5),
    bottom: getCurve(from.bottom - 0.5, to.bottom - 0.5),
  };
};
