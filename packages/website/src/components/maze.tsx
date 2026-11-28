import { Bug, Check } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { KeyCap } from "@/components/ui/key-cap";
import { useMediaQuery } from "@/hooks/use-media-query";

// The board of the example's code, and its one move, with the gap left in the wall.
const MAP = [".......", ".......", "..#.#..", "..#o#..", "..###..", ".......", "......."];
const START = { x: 0, y: 6 };
const HEART = { x: 3, y: 3 };
const SIZE = MAP.length;
const CELL = 10;
const BOARD = SIZE * CELL;
const MOVE_MS = 180;
// How long the robot spends on each move of the search it plays back.
const TRY_MS = 230;
// The calls after which a reader who has not found the way in is told where to look.
const HINT_CALLS = 14;
const SHOWN_CALLS = 6;
const DIRECTIONS = [
  { name: "up", move: [0, -1], key: "ArrowUp", glyph: "↑" },
  { name: "right", move: [1, 0], key: "ArrowRight", glyph: "→" },
  { name: "down", move: [0, 1], key: "ArrowDown", glyph: "↓" },
  { name: "left", move: [-1, 0], key: "ArrowLeft", glyph: "←" },
] as const;

type Direction = (typeof DIRECTIONS)[number];

interface Square {
  x: number;
  y: number;
}

const SQUARES = MAP.flatMap((row, y) => [...row].map((kind, x) => ({ x, y, kind })));

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
  // Whether the board is out of sight behind another view, where no key moves the player.
  isPaused: boolean;
  isRunning: boolean;
  onBugChange: (isFound: boolean) => void;
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
  const tried = reached.at(triedCount - 1);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });
  const robotRef = useRef<SVGGElement>(null);
  const shown = tried ?? player;
  const cameFrom = tried?.from;
  const lastShownRef = useRef(shown);
  const isHeartTaken = isSame(shown, HEART);
  const shownReached = reached.slice(0, triedCount);
  // Each move is a glide from the square it was made from, with a hop in the middle.
  useLayoutEffect(() => {
    const from = cameFrom ?? lastShownRef.current;
    lastShownRef.current = shown;
    if (isReduced || isSame(from, shown)) return;
    const getPlace = (square: Square) =>
      `${square.x * CELL + CELL / 2}px ${square.y * CELL + CELL / 2}px`;
    robotRef.current?.animate(
      [
        { translate: getPlace(from), scale: 1 },
        { scale: 1.12, offset: 0.5 },
        { translate: getPlace(shown), scale: 1 },
      ],
      { duration: MOVE_MS, easing: "ease-in-out" },
    );
  }, [shown.x, shown.y, cameFrom?.x, cameFrom?.y, isReduced]);

  const restart = () => {
    setPlayer(START);
    setTrail([START]);
    setCalls([]);
    setIsFloodHidden(true);
    props.onBugChange(false);
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
    props.onBugChange(isSame(next, HEART));
  };
  // The keys work while the board is on screen, from wherever the focus is, and scroll the
  // page again once it is not.
  useEffect(() => {
    if (!isInView || props.isPaused) return;
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
  // The reader's calls, or the search's once it has played out, set the same way.
  const shownCalls = search === undefined ? calls : flood?.isDone ? steps : [];
  // The goal the reader is on: move, reach the gold, then hand over to TLA-ts.
  const stage = hasBug || props.isRunning ? 2 : calls.length === 0 ? 0 : 1;
  const arrows = DIRECTIONS.map((direction) => (
    <KeyCap key={direction.name} isLit={heldKeys.has(direction.key)}>
      {direction.glyph}
    </KeyCap>
  ));
  return (
    <div className="flex w-full flex-wrap gap-x-7 gap-y-6 pt-1 pb-4">
      <div
        ref={boardRef}
        className={cn(
          "relative w-full max-w-[352px] shrink-0 touch-manipulation self-start select-none",
          hasBug && search === undefined && "motion-safe:animate-shake",
        )}
      >
        <svg
          role="img"
          aria-label="A maze with a robot in one corner and a heart walled in at its middle. The arrow keys move the robot."
          viewBox={`-1 -1 ${BOARD + 2} ${BOARD + 3}`}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="block w-full"
        >
          <rect y={1} width={BOARD} height={BOARD} rx={2.5} className="fill-foreground/15" />
          <rect width={BOARD} height={BOARD} rx={2.5} className="fill-card" />
          {SQUARES.map((square) => {
            const order = shownReached.findIndex((found) => isSame(found, square));
            const distance = Math.abs(square.x - player.x) + Math.abs(square.y - player.y);
            return (
              <g key={`${square.x} ${square.y}`}>
                <rect
                  x={square.x * CELL}
                  y={square.y * CELL}
                  width={CELL}
                  height={CELL}
                  fill="transparent"
                  // A click on a square next to the robot moves there.
                  onClick={() => {
                    const direction = DIRECTIONS.find(
                      (found) =>
                        Math.sign(square.x - player.x) === found.move[0] &&
                        Math.sign(square.y - player.y) === found.move[1],
                    );
                    if (direction && distance === 1) call(direction);
                  }}
                  className="cursor-pointer"
                />
                {order >= 0 && (
                  <rect
                    x={square.x * CELL + 0.9}
                    y={square.y * CELL + 0.9}
                    width={CELL - 1.8}
                    height={CELL - 1.8}
                    rx={1.2}
                    className={cn(
                      "pointer-events-none origin-center [transform-box:fill-box] motion-safe:animate-chip-in",
                      shownReached[order].isFailing ? "fill-destructive/35" : "fill-success/30",
                    )}
                  />
                )}
                {square.kind === "#" && (
                  <rect
                    x={square.x * CELL}
                    y={square.y * CELL}
                    width={CELL}
                    height={CELL}
                    strokeWidth={0.45}
                    className="pointer-events-none fill-secondary stroke-muted-foreground"
                  />
                )}
              </g>
            );
          })}
          <g strokeWidth={0.2} className="pointer-events-none stroke-foreground/10">
            {Array.from({ length: SIZE - 1 }, (_line, index) => (
              <path
                key={index}
                d={`M${(index + 1) * CELL} 0V${BOARD}M0 ${(index + 1) * CELL}H${BOARD}`}
              />
            ))}
          </g>
          <rect
            width={BOARD}
            height={BOARD}
            rx={2.5}
            fill="none"
            strokeWidth={0.45}
            className="pointer-events-none stroke-muted-foreground"
          />
          {search === undefined &&
            trail
              .slice(0, -1)
              .map((square, index) => (
                <circle
                  key={index}
                  cx={square.x * CELL + CELL / 2}
                  cy={square.y * CELL + CELL / 2}
                  r={0.9}
                  className="pointer-events-none fill-muted-foreground/50"
                />
              ))}
          {path && flood?.isDone && (
            <polyline
              points={path
                .map((square) => `${square.x * CELL + CELL / 2},${square.y * CELL + CELL / 2}`)
                .join(" ")}
              fill="none"
              strokeWidth={1.7}
              strokeDasharray="0.01 3.3"
              className="pointer-events-none stroke-destructive motion-safe:animate-line-in"
            />
          )}
          {!isHeartTaken && (
            <g
              transform={`translate(${HEART.x * CELL + CELL / 2} ${HEART.y * CELL + CELL / 2})`}
              className="pointer-events-none"
            >
              <ellipse cy={3.4} rx={2.4} ry={0.7} className="fill-[oklch(55%_0.2_10)]/20" />
              <path
                d="M0 2.9C-4.6 -0.4 -3.4 -3.3 -1.6 -3.3C-0.7 -3.3 -0.2 -2.8 0 -2.2C0.2 -2.8 0.7 -3.3 1.6 -3.3C3.4 -3.3 4.6 -0.4 0 2.9Z"
                className="fill-[oklch(68%_0.21_10)]"
              />
              <path
                d="M-2.4 -1.6Q-2.2 -2.6 -1.3 -2.6"
                fill="none"
                strokeWidth={0.5}
                className="stroke-white/70"
              />
            </g>
          )}
          <g
            ref={robotRef}
            style={{ translate: `${shown.x * CELL + CELL / 2}px ${shown.y * CELL + CELL / 2}px` }}
            strokeWidth={0.45}
            className="pointer-events-none stroke-muted-foreground"
          >
            <ellipse cy={3.9} rx={2.9} ry={0.8} className="fill-foreground/15 stroke-none" />
            <rect x={-3.9} y={-1.2} width={1.4} height={2.6} rx={0.6} className="fill-card" />
            <rect x={2.5} y={-1.2} width={1.4} height={2.6} rx={0.6} className="fill-card" />
            <rect x={-1.1} y={-4.2} width={2.2} height={1.2} rx={0.5} className="fill-card" />
            <rect x={-3.1} y={-3.3} width={6.2} height={6.4} rx={2.3} className="fill-card" />
            <rect
              x={-2.2}
              y={-1.5}
              width={4.4}
              height={2.7}
              rx={1.2}
              className="fill-foreground stroke-none"
            />
            {isHeartTaken ? (
              <path
                d="M-1.5 0.2Q-1 -0.7 -0.5 0.2M0.5 0.2Q1 -0.7 1.5 0.2"
                fill="none"
                strokeWidth={0.5}
                className="stroke-background"
              />
            ) : (
              <g className="fill-background stroke-none">
                <rect x={-1.35} y={-0.75} width={0.7} height={1.3} rx={0.35} />
                <rect x={0.65} y={-0.75} width={0.7} height={1.3} rx={0.35} />
              </g>
            )}
          </g>
        </svg>
        {hasBug && search === undefined && (
          <p className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm whitespace-nowrap text-white shadow-raised motion-safe:animate-drop-in">
            <Bug weight="fill" className="size-3.5" />
            Bug found · The wall has a gap
          </p>
        )}
      </div>
      {/* The column keeps the board's height, with its link at the foot, so that a longer line
          moves nothing. */}
      <div className="flex min-h-28 min-w-52 flex-1 flex-col gap-3 self-stretch sm:min-h-44">
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
                  , tried {reached.length} squares, and reached the heart:
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
              "The wall was missing a piece. Press run, and TLA-ts finds that without being told."
            )}
          </p>
        </div>
        <ol
          aria-label="Calls"
          className="flex min-h-[3.25rem] flex-wrap content-start gap-1 font-mono text-xs"
        >
          {shownCalls.length > SHOWN_CALLS && <li className="px-0.5 py-0.5 text-faint">...</li>}
          {shownCalls
            .map((made, index) => ({ made, order: index }))
            .slice(-SHOWN_CALLS)
            .map((item) => (
              <li
                key={item.order}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 motion-safe:animate-chip-in",
                  search !== undefined || hasBug
                    ? "border-transparent bg-destructive/15 text-destructive"
                    : "text-foreground",
                )}
              >
                {item.made}
              </li>
            ))}
        </ol>
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
