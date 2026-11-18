import { LOGO_PARTS } from "../logo";

// Hovering a `group/logo` ancestor makes the mark dance: twice its arms seesaw while it hops and
// taps its toe, then it flips. Every move is a whole pixel or a quarter turn.
export const Logo = () => (
  <svg
    aria-hidden
    viewBox="0 0 9 9"
    fill="currentColor"
    shapeRendering="crispEdges"
    className="size-[18px] overflow-visible"
  >
    <g className="origin-[4.5px_4.5px] group-hover/logo:animate-logo-body motion-reduce:animate-none">
      <path d={LOGO_PARTS.body} />
      <path
        d={LOGO_PARTS.leftArm}
        className="group-hover/logo:animate-logo-left-arm motion-reduce:animate-none"
      />
      <path
        d={LOGO_PARTS.rightArm}
        className="group-hover/logo:animate-logo-right-arm motion-reduce:animate-none"
      />
      <path
        d={LOGO_PARTS.toe}
        className="group-hover/logo:animate-logo-toe motion-reduce:animate-none"
      />
    </g>
  </svg>
);
