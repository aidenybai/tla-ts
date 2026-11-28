import { Bug } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { compilations } from "virtual:compilations";
import { examples } from "virtual:site-data";
import { cn } from "cn";
import type { Precompiled } from "@/lib/compilation";
import { getHighlightColors } from "@/lib/highlight-colors";
import { getLineMarks } from "@/lib/line-marks";
import { getOutputRows, getRunLines } from "@/lib/output-rows";
import { getTriedStates } from "@/lib/search";
import { useRun } from "@/hooks/use-run";
import { Code } from "./code";
import { MazeBoard } from "./maze-board";
import { getStateSquare, MAZE_HEART } from "./maze-scene";
import { SearchTree } from "./search-tree";

const STAGE = { width: 1920, height: 1080 };
const BEAT_MS = 100;
// The beats the loop's scenes start on: the TypeScript, its TLA+, the check, and the bug.
const TLA_BEAT = 24;
const CHECK_BEAT = 44;
const LOOP_BEATS = 100;
const NO_FOLDS: ReadonlySet<string> = new Set();
const START = { x: 0, y: 6 };

const subscribeToResize = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

// Ten seconds on what TLA-ts does, on a 1920 by 1080 stage that fits the window, to record.
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
  // The loop starts once there is a search to play.
  useEffect(() => {
    if (search === undefined) return;
    const beats = setInterval(() => setBeat((current) => (current + 1) % LOOP_BEATS), BEAT_MS);
    return () => clearInterval(beats);
  }, [search]);

  const tla = compiled?.tla;
  const isTlaShown = beat >= TLA_BEAT && tla !== undefined;
  const colors = useMemo(
    () => getHighlightColors(example.sourceMarks.map((mark) => mark.name)),
    [example],
  );
  const rows = useMemo(() => {
    const code = tla?.code ?? "";
    return getOutputRows({
      lines: tla?.lines ?? [],
      lineMarks: getLineMarks(code.split("\n"), []),
      source: example.typescript.code,
      sourceMarks: example.sourceMarks,
      openFolds: NO_FOLDS,
      pinnedLines: getRunLines(undefined),
    });
  }, [example, tla]);

  const states = useMemo(() => (search ? getTriedStates(search) : []), [search]);
  const triedCount = Math.min(states.length, Math.max(0, beat - CHECK_BEAT + 1));
  const isFound = states.length > 0 && triedCount === states.length;
  const tried = states.at(triedCount - 1);
  const square = triedCount > 0 ? getStateSquare(tried) : START;
  const parent = states.find((state) => state.id === tried?.parentId);
  const cameFrom = triedCount > 0 && parent ? getStateSquare(parent) : undefined;
  const caption = isFound
    ? "And finds the bug you missed."
    : beat >= CHECK_BEAT
      ? "Then it tries every move."
      : beat >= TLA_BEAT
        ? "TLA-ts turns it into TLA+."
        : "You write TypeScript.";
  return (
    <main className="fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-background">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        className="relative shrink-0"
      >
        <p className="absolute top-14 left-20 font-pixel text-5xl text-foreground">TLA-ts</p>
        <div className="absolute top-40 left-20 w-[1040px]">
          <div style={{ zoom: 1.8 }} className="h-[400px] overflow-hidden rounded-[18px]">
            <Code.Root
              source={isTlaShown ? tla : example.typescript}
              rows={isTlaShown ? rows : undefined}
              colors={colors}
            >
              <Code.Content />
            </Code.Root>
          </div>
        </div>
        <div className="absolute top-40 right-24 flex w-[520px] flex-col gap-5">
          <MazeBoard
            label="The maze, with the robot making each move TLA-ts tries."
            view={{
              player: square,
              cameFrom,
              yaw: cameFrom ? Math.atan2(square.x - cameFrom.x, square.y - cameFrom.y) : 0,
              trail: [],
              reached: states
                .slice(0, triedCount)
                .map((state) => ({ ...getStateSquare(state), isFailing: state.isFailing })),
              route: isFound ? search?.states.map(getStateSquare) : undefined,
              isHeartTaken: square.x === MAZE_HEART.x && square.y === MAZE_HEART.y,
              isStill: false,
            }}
            className={cn(isFound && "motion-safe:animate-shake")}
          >
            {isFound && (
              <p className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-destructive px-5 py-1.5 text-2xl whitespace-nowrap text-white shadow-raised motion-safe:animate-drop-in">
                <Bug weight="fill" className="size-6" />
                Bug found
              </p>
            )}
          </MazeBoard>
          <div style={{ zoom: 1.7 }} className="mx-auto w-[280px]">
            <SearchTree
              states={states}
              triedCount={triedCount}
              activeId={triedCount > 0 ? tried?.id : undefined}
              onHover={() => {}}
            />
          </div>
        </div>
        <p
          key={caption}
          className="absolute right-0 bottom-16 left-0 text-center text-6xl font-medium tracking-tight text-foreground motion-safe:animate-chip-in"
        >
          {caption}
        </p>
      </div>
    </main>
  );
};
