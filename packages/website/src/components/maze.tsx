import { Bug } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { KeyCap } from "@/components/ui/key-cap";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MazeBoard } from "./maze-board";
import { MAZE_HEART, MAZE_MAP, type Square } from "./maze-scene";

const START = { x: 0, y: 6 };

const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp", glyph: "↑" },
  { name: "left", move: [-1, 0], key: "ArrowLeft", glyph: "←" },
  { name: "down", move: [0, 1], key: "ArrowDown", glyph: "↓" },
  { name: "right", move: [1, 0], key: "ArrowRight", glyph: "→" },
] as const;

type Direction = (typeof DIRECTIONS)[number];

const go = (from: Square, direction: Direction): Square => {
  const next = { x: from.x + direction.move[0], y: from.y + direction.move[1] };
  const square = MAZE_MAP[next.y]?.[next.x];
  return square === undefined || square === "#" ? from : next;
};

const isSame = (first: Square, second: Square) => first.x === second.x && first.y === second.y;

interface MazeProps {
  onBugFound: () => void;
}

export const Maze = (props: MazeProps) => {
  const [trail, setTrail] = useState<Square[]>([START]);
  const [hasPlayed, setHasPlayed] = useState(false);
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const player = trail[trail.length - 1];
  const cameFrom = trail.at(-2);
  const hasBug = isSame(player, MAZE_HEART);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.5 });

  const call = (direction: Direction) => {
    setHasPlayed(true);
    const from = hasBug ? START : player;
    const next = go(from, direction);
    setTrail(hasBug ? [START, next] : isSame(next, from) ? trail : [...trail, next]);
    if (isSame(next, MAZE_HEART)) props.onBugFound();
  };
  // The arrow keys scroll the page again once the board is off screen.
  useEffect(() => {
    if (!isInView) return;
    const handleKey = (event: KeyboardEvent) => {
      const found = DIRECTIONS.find((item) => item.key === event.key);
      if (!found || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))
        return;
      event.preventDefault();
      call(found);
    };
    addEventListener("keydown", handleKey);
    return () => removeEventListener("keydown", handleKey);
  });
  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <MazeBoard
        label="A maze with a robot in one corner and a heart in the middle, behind walls. The arrow keys move the robot."
        view={{
          player,
          cameFrom: undefined,
          yaw: cameFrom ? Math.atan2(player.x - cameFrom.x, player.y - cameFrom.y) : 0,
          trail,
          reached: [],
          route: undefined,
          isHeartTaken: hasBug,
          isStill: isReduced,
        }}
        onPick={(square) => {
          const direction = DIRECTIONS.find(
            (found) =>
              square.x === player.x + found.move[0] && square.y === player.y + found.move[1],
          );
          if (direction) call(direction);
        }}
        className={cn(hasBug && "motion-safe:animate-shake")}
      >
        {!isTouch && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center bg-card/40 backdrop-blur-[3px] transition-opacity duration-200 ease-out motion-reduce:transition-none",
              hasPlayed && "opacity-0",
            )}
          >
            <div className="grid grid-cols-3 gap-1">
              {DIRECTIONS.map((direction) => (
                <KeyCap
                  key={direction.name}
                  className={cn(
                    direction.name === "up" && "col-start-2",
                    direction.name === "left" && "col-start-1",
                  )}
                >
                  {direction.glyph}
                </KeyCap>
              ))}
            </div>
          </div>
        )}
        {hasBug && (
          <p className="absolute top-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs whitespace-nowrap text-white shadow-raised motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3" />
            Bug found
          </p>
        )}
      </MazeBoard>
      {isTouch && (
        <div className="flex justify-center gap-2">
          {[DIRECTIONS[1], DIRECTIONS[0], DIRECTIONS[2], DIRECTIONS[3]].map((direction) => (
            <Button
              key={direction.name}
              aria-label={`Move ${direction.name}`}
              onClick={() => call(direction)}
              className="size-11 text-base text-foreground"
            >
              {direction.glyph}
            </Button>
          ))}
        </div>
      )}
      <p aria-live="polite" className="px-1 pb-0.5 text-xs text-pretty text-muted-foreground">
        {hasBug
          ? "The wall has a gap. Run the code, and TLA-ts finds it without being told."
          : "Walls are meant to close the heart in. Find a way to it."}
      </p>
    </div>
  );
};
