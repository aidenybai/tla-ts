import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { LOGO_PARTS } from "@/lib/logo";

// The mark is a small character. Hovering its `group/logo` ancestor makes it dance: twice its arms
// seesaw while it hops and taps its toe, then it flips. Clicking makes it crouch, leap into a
// full flip with its arms up, land, and bounce. Every move is a whole pixel or a quarter turn.
export const Logo = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  useEffect(() => {
    const group = svgRef.current?.closest(".group\\/logo");
    const flip = () => setIsFlipping(true);
    group?.addEventListener("click", flip);
    return () => group?.removeEventListener("click", flip);
  }, []);
  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox="0 0 9 9"
      fill="currentColor"
      shapeRendering="crispEdges"
      className="size-[18px] overflow-visible"
    >
      <g
        onAnimationEnd={() => setIsFlipping(false)}
        className={cn(
          "origin-[4.5px_4.5px] motion-reduce:animate-none",
          isFlipping ? "animate-logo-flip-body" : "group-hover/logo:animate-logo-body",
        )}
      >
        <path d={LOGO_PARTS.body} />
        <path
          d={LOGO_PARTS.leftArm}
          className={cn(
            "motion-reduce:animate-none",
            isFlipping ? "animate-logo-flip-left-arm" : "group-hover/logo:animate-logo-left-arm",
          )}
        />
        <path
          d={LOGO_PARTS.rightArm}
          className={cn(
            "motion-reduce:animate-none",
            isFlipping ? "animate-logo-flip-right-arm" : "group-hover/logo:animate-logo-right-arm",
          )}
        />
        <path
          d={LOGO_PARTS.toe}
          className={cn(
            "motion-reduce:animate-none",
            isFlipping ? "animate-logo-flip-toe" : "group-hover/logo:animate-logo-toe",
          )}
        />
      </g>
    </svg>
  );
};
