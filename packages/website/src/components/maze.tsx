import { ArrowCounterClockwise, Bug, Check } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { KeyCap } from "@/components/ui/key-cap";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createMazeScene, MAZE_HEART, MAZE_MAP, type MazeView, type Square } from "./maze-scene";

const START = { x: 0, y: 6 };
// The calls after which a reader who has not found the way in is told where to look.
const HINT_CALLS = 14;

const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp", glyph: "↑" },
  { name: "right", move: [1, 0], key: "ArrowRight", glyph: "→" },
  { name: "down", move: [0, 1], key: "ArrowDown", glyph: "↓" },
  { name: "left", move: [-1, 0], key: "ArrowLeft", glyph: "←" },
] as const;

type Direction = (typeof DIRECTIONS)[number];

const SKELETON_WALLS = MAZE_MAP.flatMap((row, y) =>
  [...row].flatMap((kind, x) => (kind === "#" ? [{ x, y }] : [])),
);

// The move of the code: one square, unless a wall or the board's edge is there.
const go = (from: Square, direction: Direction): Square => {
  const next = { x: from.x + direction.move[0], y: from.y + direction.move[1] };
  const square = MAZE_MAP[next.y]?.[next.x];
  return square === undefined || square === "#" ? from : next;
};

const isSame = (first: Square, second: Square) => first.x === second.x && first.y === second.y;

const GOALS = ["Move around", "Reach the heart", "Run the code below"];

interface MazeProps {
  // Called when the reader reaches the heart.
  onBugFound: () => void;
}

// Each square of the board is one state of the example's code, so the reader walks the states
// TLA-ts checks. An arrow key calls `move`.
export const Maze = (props: MazeProps) => {
  // The squares the reader has stood on, in order, which the board draws as their way.
  const [trail, setTrail] = useState<Square[]>([START]);
  const [moveCount, setMoveCount] = useState(0);
  const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>(new Set());
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const player = trail[trail.length - 1];
  const hasBug = isSame(player, MAZE_HEART);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Whether the scene has drawn its first frame over the board's outline.
  const [isDrawn, setIsDrawn] = useState(false);
  const sceneRef = useRef<ReturnType<typeof createMazeScene>>(undefined);
  const viewRef = useRef<MazeView>(undefined);
  // The scene draws itself every frame from the game as it last rendered, while it is in sight.
  useEffect(() => {
    const left = trail.at(-2);
    viewRef.current = {
      player,
      cameFrom: undefined,
      yaw: left ? Math.atan2(player.x - left.x, player.y - left.y) : 0,
      trail,
      reached: [],
      route: undefined,
      isHeartTaken: hasBug,
      isStill: isReduced,
    };
  });
  useEffect(() => {
    if (!isInView || !canvasRef.current) return;
    sceneRef.current ??= createMazeScene(canvasRef.current, MAZE_MAP);
    const scene = sceneRef.current;
    if (!scene) return;
    let frame = requestAnimationFrame(function paint(now) {
      if (viewRef.current) scene.draw(viewRef.current, now);
      setIsDrawn(true);
      frame = requestAnimationFrame(paint);
    });
    return () => cancelAnimationFrame(frame);
  }, [isInView]);

  const call = (direction: Direction) => {
    // A move after the heart is reached starts a new game.
    const from = hasBug ? START : player;
    const next = go(from, direction);
    setTrail(hasBug ? [START, next] : isSame(next, from) ? trail : [...trail, next]);
    setMoveCount(hasBug ? 1 : moveCount + 1);
    if (isSame(next, MAZE_HEART)) props.onBugFound();
  };
  // The keys work while the board is on screen, from wherever the focus is, and scroll the
  // page again once it is not.
  useEffect(() => {
    if (!isInView) return;
    const handleKey = (event: KeyboardEvent) => {
      const found = DIRECTIONS.find((item) => item.key === event.key);
      if (!found || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))
        return;
      event.preventDefault();
      setHeldKeys((held) => new Set(held).add(event.key));
      call(found);
    };
    const handleKeyUp = (event: KeyboardEvent) =>
      setHeldKeys((held) => new Set([...held].filter((key) => key !== event.key)));
    addEventListener("keydown", handleKey);
    addEventListener("keyup", handleKeyUp);
    return () => {
      removeEventListener("keydown", handleKey);
      removeEventListener("keyup", handleKeyUp);
    };
  });
  // The goal the reader is on: move, reach the heart, then run the code.
  const stage = hasBug ? 2 : moveCount === 0 ? 0 : 1;
  return (
    <div className="flex w-full flex-wrap items-center gap-x-7 gap-y-6">
      <div
        ref={boardRef}
        className={cn(
          "relative w-full max-w-[336px] shrink-0 touch-manipulation overflow-hidden rounded-xl select-none",
          hasBug && "motion-safe:animate-shake",
        )}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A maze with a robot in one corner and a heart in the middle, behind walls. The arrow keys move the robot."
          // A click on a square next to the robot moves there.
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const square = sceneRef.current?.pick(
              (event.clientX - box.left) / box.width,
              (event.clientY - box.top) / box.height,
            );
            const direction = DIRECTIONS.find(
              (found) =>
                square?.x === player.x + found.move[0] && square.y === player.y + found.move[1],
            );
            if (direction) call(direction);
          }}
          className="relative block aspect-[20/19] w-full cursor-pointer"
        />
        {/* The board's outline, in the page as it arrives, until the scene draws over it. */}
        {!isDrawn && (
          <svg
            aria-hidden
            viewBox="0 0 716 680"
            className="pointer-events-none absolute inset-0 size-full"
          >
            <rect
              x={8}
              y={13}
              width={700}
              height={634}
              strokeWidth={2}
              className="fill-none stroke-border"
            />
            {SKELETON_WALLS.map((wall) => (
              <rect
                key={`${wall.x} ${wall.y}`}
                x={8 + wall.x * 100}
                y={13 + wall.y * 90.5 - 28}
                width={100}
                height={90.5}
                className="fill-muted"
              />
            ))}
            <circle cx={58} cy={581} r={28} className="fill-muted" />
          </svg>
        )}
        {hasBug && (
          <p className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm whitespace-nowrap text-white shadow-raised motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3.5" />
            Bug found · The wall has a gap
          </p>
        )}
      </div>
      <div className="flex min-w-52 flex-1 flex-col gap-3 self-stretch py-1">
        <ol className="flex flex-col gap-2.5">
          {GOALS.map((goal, index) => {
            const isBug = index === 1 && hasBug;
            const isDone = index === 0 && moveCount > 0;
            return (
              <li key={goal} className="flex gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums transition-colors duration-200 ease-out",
                    isBug
                      ? "bg-destructive/15 text-destructive"
                      : isDone
                        ? "bg-success/15 text-success"
                        : index === stage
                          ? "bg-foreground text-background"
                          : "bg-muted text-faint",
                  )}
                >
                  {isBug ? (
                    <Bug weight="fill" className="size-3" />
                  ) : isDone ? (
                    <Check weight="bold" className="size-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "transition-colors duration-200 ease-out",
                    isBug ? "text-destructive" : index === stage ? "text-foreground" : "text-faint",
                  )}
                >
                  {goal}
                </span>
              </li>
            );
          })}
        </ol>
        {/* The help for the goal in hand has its own place under the list, tall enough for the
            longest of it, so that moving on to the next goal moves no goal. */}
        <div className="min-h-[5.5rem]">
          <p
            key={stage}
            aria-live="polite"
            className="text-sm text-pretty text-muted-foreground motion-safe:animate-chip-in"
          >
            {stage === 0 &&
              (isTouch ? (
                "Tap a square next to the robot to move there."
              ) : (
                <>
                  Press{" "}
                  {DIRECTIONS.map((direction) => (
                    <KeyCap key={direction.name} isLit={heldKeys.has(direction.key)}>
                      {direction.glyph}
                    </KeyCap>
                  ))}{" "}
                  to move one square.
                </>
              ))}
            {stage === 1 &&
              (moveCount < HINT_CALLS
                ? "Walls are meant to close the heart in. Find a way to it."
                : "Hint: walk all the way round the walls.")}
            {stage === 2 &&
              "The wall was missing a piece. Run the code below, and TLA-ts finds that without being told."}
          </p>
        </div>
        {moveCount > 0 && (
          <Button
            onClick={() => {
              setTrail([START]);
              setMoveCount(0);
            }}
            className="mt-1 self-start pl-2 text-foreground"
          >
            <ArrowCounterClockwise className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
