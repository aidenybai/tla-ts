import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { compilations } from "virtual:compilations";
import { examples } from "virtual:site-data";
import { cn } from "cn";
import type { Precompiled } from "@/lib/compilation";
import { getPath, getTriedStates } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { MazeBoard } from "./maze-board";
import { getStateSquare, MAZE_HEART } from "./maze-scene";
import { SearchTree } from "./search-tree";

const STAGE = { width: 1920, height: 1080 };
const BEAT_MS = 100;
const LOOP_BEATS = 100;
// The moves of the search the robot makes in a beat, which leaves the last third of the loop on
// the bug it found.
const MOVES_PER_BEAT = 0.6;
// The beat the board, which fills the stage until then, draws back to show the tree on.
const TREE_BEAT = 22;

const subscribeToResize = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

// Ten seconds of TLA-ts checking the maze, on a 1920 by 1080 stage that fits the window, to record.
export const Explainer = () => {
  const example = examples[0];
  const runner = useRun(true);
  const [compiled, setCompiled] = useState<Precompiled>();
  const [beat, setBeat] = useState(0);
  const scale = useSyncExternalStore(
    subscribeToResize,
    () => Math.min(innerWidth / STAGE.width, innerHeight / STAGE.height),
    () => 1,
  );
  useEffect(() => {
    void compilations[example.fileName]?.().then(setCompiled);
  }, [example]);
  useEffect(() => {
    if (compiled === undefined) return;
    runner.run({
      source: compiled.compilation.tla,
      config: compiled.compilation.config,
      modules: compiled.compilation.modules,
      isSearchShown: true,
      typescript: { source: example.typescript.code, fileName: example.fileName },
    });
    // The run starts once, when the compilation loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled]);
  const search = runner.result?.search;
  // The clip is on black, whatever theme the page was left in.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      root.classList.toggle("dark", wasDark);
    };
  }, []);
  // The loop starts once there is a search to play.
  useEffect(() => {
    if (search === undefined) return;
    // ?beat=60 holds the loop on one beat, for a still.
    const held = new URLSearchParams(location.search).get("beat");
    if (held !== null) return setBeat(Number(held));
    const startedAt = performance.now();
    // The beat comes from the clock, so a slow frame does not stretch the ten seconds.
    const beats = setInterval(
      () => setBeat(Math.floor((performance.now() - startedAt) / BEAT_MS) % LOOP_BEATS),
      BEAT_MS / 4,
    );
    return () => clearInterval(beats);
  }, [search]);

  const states = useMemo(() => (search ? getTriedStates(search) : []), [search]);
  const statesById = useMemo(() => new Map(states.map((state) => [state.id, state])), [states]);
  const triedCount = Math.min(states.length, Math.floor(beat * MOVES_PER_BEAT) + 1);
  const isFound = states.length > 0 && triedCount === states.length;
  const tried = states.at(triedCount - 1);
  const square = tried ? getStateSquare(tried) : { x: 0, y: 6 };
  const parent = statesById.get(tried?.parentId ?? "");
  const cameFrom = parent && getStateSquare(parent);
  return (
    <main className="fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-card">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        data-beat={search ? beat : undefined}
        className="relative shrink-0"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <MazeBoard
            isPerspective
            label="The maze, with the robot making each move TLA-ts tries."
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
              isStill: false,
            }}
            className={cn(
              "shrink-0 transition-[width] duration-[1200ms] ease-[cubic-bezier(0.3,1,0.4,1)]",
              beat >= TREE_BEAT ? "w-[860px]" : "w-[1560px]",
              isFound && "motion-safe:animate-shake",
            )}
          />
          <div
            style={{ zoom: 2.9 }}
            className={cn(
              "overflow-hidden transition-[width,margin,opacity] duration-[1200ms] ease-[cubic-bezier(0.3,1,0.4,1)]",
              beat >= TREE_BEAT ? "ml-5 w-[300px]" : "ml-0 w-0 opacity-0",
            )}
          >
            <div className="w-[280px]">
              <SearchTree
                states={states}
                triedCount={triedCount}
                activeId={tried?.id}
                onHover={() => {}}
                isFormal
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
