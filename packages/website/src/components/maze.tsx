import { Bug, Check } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { KeyCap } from "@/components/ui/key-cap";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createMazeScene, type MazeView, type Square } from "./maze-scene";
import { SearchTree } from "./search-tree";

// The board of the example's code, and its one move, with the gap left in the wall.
const MAP = [".......", ".......", "..#.#..", "..#o#..", "..###..", ".......", "......."];
const START = { x: 0, y: 6 };
const HEART = { x: 3, y: 3 };
// How long the robot spends on each move of the search it plays back.
const TRY_MS = 230;
// The calls after which a reader who has not found the way in is told where to look.
const HINT_CALLS = 14;
const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp", glyph: "↑" },
  { name: "right", move: [1, 0], key: "ArrowRight", glyph: "→" },
  { name: "down", move: [0, 1], key: "ArrowDown", glyph: "↓" },
  { name: "left", move: [-1, 0], key: "ArrowLeft", glyph: "←" },
] as const;

type Direction = (typeof DIRECTIONS)[number];

const SKELETON_WALLS = MAP.flatMap((row, y) =>
  [...row].flatMap((kind, x) => (kind === "#" ? [{ x, y }] : [])),
);

// The move of the code: one square, unless a wall or the board's edge is there.
const go = (from: Square, direction: Direction): Square => {
  const next = {
    x: from.x + direction.move[0],
    y: from.y + direction.move[1],
  };
  const square = MAP[next.y]?.[next.x];
  return square === undefined || square === "#" ? from : next;
};

const isSame = (first: Square, second: Square) => first.x === second.x && first.y === second.y;

const GOALS = ["Move around", "Reach the heart", "Let TLA-ts find the way"];

interface MazeProps {
  // The search of the last run, whose squares the board fills in the order it reached them.
  search: Search | undefined;
  isRunning: boolean;
  // Called when the reader reaches the heart.
  onBugFound: () => void;
  // Shows the game's own code, as the reader wrote it or as TLA-ts checks it.
  onShowCode: (view: "typescript" | "tla") => void;
}

// Each square of the board is one state of the game's code, so the reader walks the states
// TLA-ts checks. An arrow key calls `move`.
export const Maze = (props: MazeProps) => {
  const [player, setPlayer] = useState(START);
  // The squares the reader has stood on, in order, which the board draws as their way.
  const [trail, setTrail] = useState<Square[]>([START]);
  // The calls the reader has made, in the words of the code.
  const [calls, setCalls] = useState<string[]>([]);
  const [heldKeys, setHeldKeys] = useState<ReadonlySet<string>>(new Set());
  // The search on the board, and whether its flood has reached its last square.
  const [flood, setFlood] = useState<{ search: Search; isDone: boolean }>();
  const [isFloodHidden, setIsFloodHidden] = useState(false);
  // The state of the search the robot is trying, while it plays the search back.
  const [attempt, setAttempt] = useState(0);
  const [hoveredId, setHoveredId] = useState<string>();
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (props.search && flood?.search !== props.search) {
    setFlood({ search: props.search, isDone: isReduced });
    setAttempt(0);
    setIsFloodHidden(false);
    // The player goes back to the start, where the search begins, and off the gold.
    setPlayer(START);
    setTrail([START]);
  }
  // A second run keeps the first one's flood on the board until its own arrives.
  const search = isFloodHidden ? undefined : flood?.search;
  // The squares the search reached, in the order it reached them, with the heart last.
  const reached = useMemo(() => {
    const states = search?.checkedStates ?? [];
    const getSquare = (state: SearchState | undefined) => {
      const values = new Map(state?.variables.map((variable) => [variable.name, variable.value]));
      return { x: Number(values.get("x")), y: Number(values.get("y")) };
    };
    return [
      ...states.filter((state) => !state.isFailing),
      ...states.filter((state) => state.isFailing),
    ].map((state) => ({
      ...getSquare(state),
      state,
      isFailing: state.isFailing,
      // The square the move that reached this one was made from.
      from:
        state.parentId === undefined
          ? undefined
          : getSquare(states.find((found) => found.id === state.parentId)),
    }));
  }, [search]);
  const isFlooding = search !== undefined && flood?.isDone === false;
  const floodMs = reached.length * TRY_MS;
  // The robot makes each move the search made, one after another, from where that move began.
  useEffect(() => {
    if (!isFlooding) return;
    const moves = setInterval(() => setAttempt((current) => current + 1), TRY_MS);
    const timer = setTimeout(
      () => setFlood((current) => current && { ...current, isDone: true }),
      floodMs + 300,
    );
    return () => {
      clearInterval(moves);
      clearTimeout(timer);
    };
  }, [isFlooding, floodMs]);
  const hasBug = isSame(player, HEART);
  const triedCount = isFlooding ? Math.min(attempt + 1, reached.length) : reached.length;
  // A state pointed at in the tree shows on the board, once the search has played out.
  const tried =
    (isFlooding ? undefined : reached.find((found) => found.state.id === hoveredId)) ??
    reached.at(triedCount - 1);
  const states = useMemo(() => reached.map((found) => found.state), [reached]);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Whether the scene has drawn its first frame over the board's outline.
  const [isDrawn, setIsDrawn] = useState(false);
  const sceneRef = useRef<ReturnType<typeof createMazeScene>>(undefined);
  const viewRef = useRef<MazeView>(undefined);
  const shown = tried ?? player;
  // The square the robot last left, which it turns its back on.
  const leftSquare = tried ? tried.from : trail.at(-2);
  // The scene draws itself every frame from the game as it last rendered, while it is in sight.
  useEffect(() => {
    viewRef.current = {
      player: shown,
      cameFrom: tried?.from,
      yaw: leftSquare ? Math.atan2(shown.x - leftSquare.x, shown.y - leftSquare.y) : 0,
      trail: search === undefined ? trail : [],
      reached: reached.slice(0, triedCount),
      route: flood?.isDone ? path : undefined,
      isHeartTaken: isSame(shown, HEART),
      isStill: isReduced,
    };
  });
  useEffect(() => {
    if (!isInView || !canvasRef.current) return;
    sceneRef.current ??= createMazeScene(canvasRef.current, MAP);
    const scene = sceneRef.current;
    if (!scene) return;
    let frame = requestAnimationFrame(function paint(now) {
      if (viewRef.current) scene.draw(viewRef.current, now);
      setIsDrawn(true);
      frame = requestAnimationFrame(paint);
    });
    return () => cancelAnimationFrame(frame);
  }, [isInView]);

  const restart = () => {
    setPlayer(START);
    setTrail([START]);
    setCalls([]);
    setIsFloodHidden(true);
  };
  const call = (direction: Direction) => {
    if (isFlooding) return;
    // A move after the heart is reached, or after TLA-ts has had the board, starts a new game.
    const from = hasBug || search !== undefined ? START : player;
    const next = go(from, direction);
    setPlayer(next);
    setTrail(from === player ? (next === from ? trail : [...trail, next]) : [START, next]);
    setIsFloodHidden(true);
    const made = `move("${direction.name}")`;
    setCalls(from === player ? [...calls, made] : [made]);
    if (isSame(next, HEART)) props.onBugFound();
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
  const steps = search?.states.flatMap((state) => state.call ?? []) ?? [];
  const path = search?.states.map((state) => {
    const values = new Map(state.variables.map((variable) => [variable.name, variable.value]));
    return { x: Number(values.get("x")), y: Number(values.get("y")) };
  });
  // The goal the reader is on: move, reach the gold, then hand over to TLA-ts.
  const stage = hasBug || props.isRunning ? 2 : calls.length === 0 ? 0 : 1;
  const arrows = DIRECTIONS.map((direction) => (
    <KeyCap key={direction.name} isLit={heldKeys.has(direction.key)}>
      {direction.glyph}
    </KeyCap>
  ));
  return (
    <div className="flex w-full flex-wrap items-center gap-x-7 gap-y-6">
      <div
        ref={boardRef}
        className={cn(
          "relative w-full max-w-[336px] shrink-0 touch-manipulation overflow-hidden rounded-xl select-none",
          hasBug && search === undefined && "motion-safe:animate-shake",
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
        {hasBug && search === undefined && (
          <p className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm whitespace-nowrap text-white shadow-raised motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3.5" />
            Bug found · The wall has a gap
          </p>
        )}
      </div>
      {/* The column keeps the board's height, with its link at the foot, so that a longer line
          moves nothing. */}
      <div className="flex min-w-52 flex-1 flex-col gap-3 self-stretch py-1">
        <ol className="flex flex-col gap-2.5">
          {GOALS.map((goal, index) => {
            const isCurrent = index === stage && search === undefined;
            const isBug = index === 1 && (hasBug || search !== undefined);
            const isDone =
              index === 0
                ? calls.length > 0 || search !== undefined
                : index === 2 && flood?.isDone === true && search !== undefined;
            return (
              <li key={goal} className="flex gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums transition-colors duration-200 ease-out",
                    isBug
                      ? "bg-destructive/15 text-destructive"
                      : isDone
                        ? "bg-success/15 text-success"
                        : isCurrent || (index === 2 && search !== undefined)
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
                    isBug
                      ? "text-destructive"
                      : isCurrent || (index === 2 && search !== undefined)
                        ? "text-foreground"
                        : "text-faint",
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
            key={search === undefined ? stage : "flood"}
            aria-live="polite"
            className="text-sm text-pretty text-muted-foreground motion-safe:animate-chip-in"
          >
            {props.isRunning ? (
              "TLA-ts is trying every square the code can reach."
            ) : search !== undefined ? (
              flood?.isDone ? (
                <>
                  TLA-ts turned the game&rsquo;s{" "}
                  <Button
                    variant="link"
                    size="inline"
                    onClick={() => props.onShowCode("typescript")}
                  >
                    TypeScript
                  </Button>{" "}
                  into{" "}
                  <Button variant="link" size="inline" onClick={() => props.onShowCode("tla")}>
                    TLA+
                  </Button>
                  , tried {reached.length} squares, and reached the heart in {steps.length} moves.
                </>
              ) : (
                `TLA-ts is trying move ${triedCount} of ${reached.length}.`
              )
            ) : stage === 0 ? (
              isTouch ? (
                "Tap a square next to the player to move there."
              ) : (
                <>Press {arrows} to move one square.</>
              )
            ) : stage === 1 ? (
              calls.length < HINT_CALLS ? (
                "Walls are meant to close the heart in. Find a way to it."
              ) : (
                "Hint: walk all the way round the walls."
              )
            ) : (
              "The wall was missing a piece. TLA-ts is finding that out for itself."
            )}
          </p>
        </div>
        {/* The search as a tree: each state hangs under the one its move was made from, and
            appears as the robot makes that move. */}
        {search !== undefined && (
          <SearchTree
            states={states}
            triedCount={triedCount}
            activeId={tried?.state.id}
            onHover={setHoveredId}
          />
        )}
        {(calls.length > 0 || search !== undefined) && !isFlooding && (
          <Button
            variant="link"
            size="inline"
            onClick={restart}
            className="mt-auto self-start text-sm"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
