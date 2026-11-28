import { useEffect, useMemo, useState } from "react";
import { getPath, getTriedStates, type Search } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MazeBoard } from "./maze-board";
import { getStateSquare, MAZE_HEART } from "./maze-scene";
import { SearchTree } from "./search-tree";

// How long the robot spends on each move of the search it plays back.
const TRY_MS = 230;

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
  const states = useMemo(() => getTriedStates(props.search), [props.search]);
  const statesById = useMemo(() => new Map(states.map((state) => [state.id, state])), [states]);
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

  const square = getStateSquare(tried);
  const cameFrom = parent && getStateSquare(parent);
  return (
    <div className="flex flex-col gap-2">
      <MazeBoard
        label="The maze, with the robot making each move TLA-ts tried."
        view={{
          player: square,
          cameFrom,
          yaw: cameFrom ? Math.atan2(square.x - cameFrom.x, square.y - cameFrom.y) : 0,
          trail: [],
          reached: states
            .slice(0, triedCount)
            .map((state) => ({ ...getStateSquare(state), isFailing: state.isFailing })),
          route: getPath(statesById, tried?.id).map(getStateSquare),
          isHeartTaken: square.x === MAZE_HEART.x && square.y === MAZE_HEART.y,
          isStill: isReduced,
        }}
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
