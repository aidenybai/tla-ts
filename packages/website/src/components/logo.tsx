import { LOGO_PARTS } from "../logo";

// Hovering a `group/logo` ancestor makes the mark dance: its arms seesaw and it hops, one whole
// pixel at a time.
export const Logo = () => (
  <svg
    aria-hidden
    viewBox="0 0 9 9"
    fill="currentColor"
    shapeRendering="crispEdges"
    className="size-[18px] overflow-visible"
  >
    <g className="group-hover/logo:animate-logo-hop motion-reduce:animate-none">
      <path d={LOGO_PARTS.body} />
      <path
        d={LOGO_PARTS.leftArm}
        className="group-hover/logo:animate-logo-left-arm motion-reduce:animate-none"
      />
      <path
        d={LOGO_PARTS.rightArm}
        className="group-hover/logo:animate-logo-right-arm motion-reduce:animate-none"
      />
    </g>
  </svg>
);
