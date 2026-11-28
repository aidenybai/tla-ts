import { useEffect, useMemo, useRef, useState } from "react";
import type { Search, SearchState } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createMazeScene, MAZE_HEART, MAZE_MAP, type MazeView } from "./maze-scene";
import { SearchTree } from "./search-tree";

// How long the robot spends on each move of the search it plays back.
const TRY_MS = 230;

const getSquare = (state: SearchState | undefined) => {
  const values = new Map(state?.variables.map((variable) => [variable.name, variable.value]));
  return { x: Number(values.get("x")), y: Number(values.get("y")) };
};

interface MazeReplayProps {
  search: Search;
  // Puts the board back in the reader's hands.
  onClose: () => void;
}

// A small board that plays a search back: the robot makes every move the search made, each from
// the square that move began on, while the search's tree grows under it.
export const MazeReplay = (props: MazeReplayProps) => {
  const isReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [played, setPlayed] = useState(props.search);
  // The move of the search the robot is making.
  const [attempt, setAttempt] = useState(0);
  const [hoveredId, setHoveredId] = useState<string>();
  if (played !== props.search) {
    setPlayed(props.search);
    setAttempt(0);
  }
  // The states the search reached, in the order it reached them, with the heart last.
  const states = useMemo(() => {
    const checked = props.search.checkedStates;
    return [
      ...checked.filter((state) => !state.isFailing),
      ...checked.filter((state) => state.isFailing),
    ];
  }, [props.search]);
  const isDone = isReduced || attempt >= states.length;
  useEffect(() => {
    if (isDone) return;
    const moves = setInterval(() => setAttempt((current) => current + 1), TRY_MS);
    return () => clearInterval(moves);
  }, [isDone]);
  const triedCount = isDone ? states.length : attempt + 1;
  // A state pointed at in the tree shows on the board, once the search has played out.
  const tried =
    (isDone ? states.find((state) => state.id === hoveredId) : undefined) ??
    states.at(triedCount - 1);
  const parent = states.find((state) => state.id === tried?.parentId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<MazeView>(undefined);
  useEffect(() => {
    const square = getSquare(tried);
    const from = parent && getSquare(parent);
    viewRef.current = {
      player: square,
      cameFrom: from,
      yaw: from ? Math.atan2(square.x - from.x, square.y - from.y) : 0,
      trail: [],
      reached: states
        .slice(0, triedCount)
        .map((state) => ({ ...getSquare(state), isFailing: state.isFailing })),
      route: isDone ? props.search.states.map(getSquare) : undefined,
      isHeartTaken: square.x === MAZE_HEART.x && square.y === MAZE_HEART.y,
      isStill: isReduced,
    };
  });
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = createMazeScene(canvasRef.current, MAZE_MAP);
    if (!scene) return;
    let frame = requestAnimationFrame(function paint(now) {
      if (viewRef.current) scene.draw(viewRef.current, now);
      frame = requestAnimationFrame(paint);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="The maze, with the robot making each move TLA-ts tried."
        className="block aspect-[20/19] w-full rounded-lg"
      />
      <SearchTree
        states={states}
        triedCount={triedCount}
        activeId={tried?.id}
        onHover={setHoveredId}
      />
      <p aria-live="polite" className="px-1 text-xs text-pretty text-muted-foreground tabular-nums">
        {isDone
          ? `Tried ${states.length} squares. Reached the heart in ${props.search.states.length - 1} moves.`
          : `Trying move ${triedCount} of ${states.length}.`}
      </p>
      {isDone && (
        <Button
          variant="link"
          size="inline"
          onClick={props.onClose}
          className="self-start px-1 pb-0.5 text-xs"
        >
          Play it yourself
        </Button>
      )}
    </div>
  );
};
