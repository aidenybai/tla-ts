import { cn } from "@/lib/utils";

// Each action in a trace gets its own shape and color, so repeated actions are easy to follow.
const GLYPHS = [
  { path: "M6 1a5 5 0 1 1 0 10A5 5 0 1 1 6 1Z", className: "fill-blue-500" },
  { path: "M1.5 1.5h9v9h-9Z", className: "fill-amber-500" },
  { path: "M6 1l5 9.5H1Z", className: "fill-emerald-500" },
  { path: "M6 .5L11.5 6 6 11.5.5 6Z", className: "fill-violet-500" },
  { path: "M3.5 1.5h5L11 6l-2.5 4.5h-5L1 6Z", className: "fill-cyan-500" },
  { path: "M4.5 1h3v3.5H11v3H7.5V11h-3V7.5H1v-3h3.5Z", className: "fill-orange-500" },
  {
    path: "M6 .8l1.5 3.4 3.7.4-2.8 2.5.8 3.6L6 8.9l-3.2 1.8.8-3.6L.8 4.6l3.7-.4Z",
    className: "fill-fuchsia-500",
  },
];

interface ActionGlyphProps {
  index: number;
  className?: string;
}

export const ActionGlyph = (props: ActionGlyphProps) => {
  const glyph = GLYPHS[props.index % GLYPHS.length];
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={cn("size-3 shrink-0", props.className)}>
      <path d={glyph.path} className={glyph.className} />
    </svg>
  );
};
