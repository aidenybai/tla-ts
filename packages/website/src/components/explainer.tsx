import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { compilations } from "virtual:compilations";
import { examples } from "virtual:site-data";
import { cn } from "cn";
import type { Precompiled } from "@/lib/compilation";
import { getTriedStates } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { MazeBoard } from "./maze-board";
import { getStateSquare, MAZE_HEART } from "./maze-scene";
import { SearchTree } from "./search-tree";

const STAGE = { width: 1920, height: 1080 };
const BEAT_MS = 100;
const LOOP_BEATS = 100;
// A game played by hand, which walks up to the walls and does not find the way in.
const PLAYED = [
  { x: 0, y: 6 },
  { x: 1, y: 6 },
  { x: 2, y: 6 },
  { x: 3, y: 6 },
  { x: 3, y: 5 },
  { x: 4, y: 5 },
  { x: 5, y: 5 },
  { x: 5, y: 4 },
  { x: 5, y: 3 },
];
const BEATS_PER_PLAYED_MOVE = 3;
// The beat the check starts on, after the game and a pause on its last square.
const CHECK_BEAT = 34;

const subscribeToResize = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

// Ten seconds of the maze played by hand and then checked by TLA-ts, on a 1920 by 1080 stage that fits the window, to record.
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
  const isChecking = beat >= CHECK_BEAT;
  const triedCount = isChecking ? Math.min(states.length, beat - CHECK_BEAT + 1) : 0;
  const played = PLAYED.slice(0, Math.floor(beat / BEATS_PER_PLAYED_MOVE) + 1);
  const isFound = states.length > 0 && triedCount === states.length;
  const tried = states.at(triedCount - 1);
  const square = isChecking ? getStateSquare(tried) : played[played.length - 1];
  const parent = states.find((state) => state.id === tried?.parentId);
  const cameFrom = isChecking ? parent && getStateSquare(parent) : undefined;
  const facedFrom = cameFrom ?? played.at(-2);
  return (
    <main className="fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-black">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        data-beat={search ? beat : undefined}
        className="relative shrink-0"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <MazeBoard
            label="The maze, with the robot making each move TLA-ts tries."
            view={{
              player: square,
              cameFrom,
              yaw: facedFrom ? Math.atan2(square.x - facedFrom.x, square.y - facedFrom.y) : 0,
              trail: isChecking ? [] : played,
              reached: states
                .slice(0, triedCount)
                .map((state) => ({ ...getStateSquare(state), isFailing: state.isFailing })),
              route: isFound ? search?.states.map(getStateSquare) : undefined,
              isHeartTaken: square.x === MAZE_HEART.x && square.y === MAZE_HEART.y,
              isStill: false,
            }}
            className={cn("w-[780px] shrink-0", isFound && "motion-safe:animate-shake")}
          />
          <div
            style={{ zoom: 2.9 }}
            className={cn(
              "overflow-hidden transition-[width,margin,opacity] duration-700 ease-[cubic-bezier(0.3,1,0.4,1)]",
              isChecking ? "ml-10 w-[280px]" : "ml-0 w-0 opacity-0",
            )}
          >
            <div className="w-[280px]">
              <SearchTree
                states={states}
                triedCount={triedCount}
                activeId={triedCount > 0 ? tried?.id : undefined}
                onHover={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
