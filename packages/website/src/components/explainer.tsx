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
// The beats the loop's scenes start on: the title, the TypeScript, its TLA+, the check, and the end.
const CODE_BEAT = 22;
const TLA_BEAT = 34;
const CHECK_BEAT = 47;
const END_BEAT = 89;
const LOOP_BEATS = 100;
// The moves of the search the robot makes in a beat.
const MOVES_PER_BEAT = 1.25;
const SCENE_CLASS_NAME =
  "absolute inset-0 flex flex-col items-center justify-center transition-[opacity,scale,filter] duration-500 ease-out";
const HIDDEN_SCENE_CLASS_NAME = "pointer-events-none scale-[0.97] opacity-0 blur-md";
const CAPTION_CLASS_NAME =
  "text-center text-7xl font-semibold tracking-tight text-foreground motion-safe:animate-blur-in";
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
  const triedCount = Math.min(
    states.length,
    Math.max(0, Math.floor((beat - CHECK_BEAT) * MOVES_PER_BEAT) + 1),
  );
  const isFound = states.length > 0 && triedCount === states.length;
  const tried = states.at(triedCount - 1);
  const square = triedCount > 0 ? getStateSquare(tried) : START;
  const parent = states.find((state) => state.id === tried?.parentId);
  const cameFrom = triedCount > 0 && parent ? getStateSquare(parent) : undefined;
  const scene =
    beat >= END_BEAT ? "end" : beat >= CHECK_BEAT ? "check" : beat >= CODE_BEAT ? "code" : "title";
  const checkCaption = isFound
    ? `Bug found in ${(search?.states.length ?? 1) - 1} moves.`
    : "Then it checks every move.";
  return (
    <main className="fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-black">
      <div
        style={{ width: STAGE.width, height: STAGE.height, zoom: scale }}
        className="relative shrink-0"
      >
        <div className={cn(SCENE_CLASS_NAME, scene !== "title" && HIDDEN_SCENE_CLASS_NAME)}>
          <h1
            key={beat < CODE_BEAT ? "shown" : "hidden"}
            className="text-center text-[140px]/[1.05] font-semibold tracking-tighter text-foreground"
          >
            {["TLA-ts", "formally", "verifies", "TypeScript."].map((word, index) => (
              <span
                key={word}
                style={{ animationDelay: `${index * 110}ms` }}
                className={cn(
                  "inline-block motion-safe:animate-blur-in",
                  index === 0 && "mr-[0.25em] font-pixel text-[120px] tracking-normal",
                  index === 1 && "mr-[0.25em]",
                  index === 3 && "block",
                )}
              >
                {word}
              </span>
            ))}
          </h1>
        </div>
        <div
          className={cn(SCENE_CLASS_NAME, "gap-14", scene !== "code" && HIDDEN_SCENE_CLASS_NAME)}
        >
          <h2 key={isTlaShown ? "tla" : "typescript"} className={CAPTION_CLASS_NAME}>
            {isTlaShown ? "TLA-ts turns it into TLA+." : "You write TypeScript."}
          </h2>
          <div className="w-[1280px]">
            <div
              style={{ zoom: 1.75 }}
              className="h-[400px] overflow-hidden rounded-[18px] mask-[linear-gradient(to_bottom,black_calc(100%-40px),transparent)]"
            >
              <Code.Root
                source={isTlaShown ? tla : example.typescript}
                rows={isTlaShown ? rows : undefined}
                colors={colors}
              >
                <Code.Content />
              </Code.Root>
            </div>
          </div>
        </div>
        <div
          className={cn(SCENE_CLASS_NAME, "gap-12", scene !== "check" && HIDDEN_SCENE_CLASS_NAME)}
        >
          <h2 key={checkCaption} className={cn(CAPTION_CLASS_NAME, isFound && "text-destructive")}>
            {checkCaption}
          </h2>
          <div className="flex items-center gap-24">
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
              className={cn("w-[700px] shrink-0", isFound && "motion-safe:animate-shake")}
            />
            <div className="flex w-[760px] flex-col gap-8">
              <p className="font-pixel text-4xl text-muted-foreground tabular-nums">
                <span className={isFound ? "text-destructive" : "text-foreground"}>
                  {triedCount}
                </span>{" "}
                of {states.length} states
              </p>
              <div style={{ zoom: 2.7 }} className="h-[170px] w-[280px]">
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
        <div className={cn(SCENE_CLASS_NAME, "gap-12", scene !== "end" && HIDDEN_SCENE_CLASS_NAME)}>
          <p className="font-pixel text-[150px]/[1] text-foreground">TLA-ts</p>
          <p className="rounded-full bg-foreground px-10 py-5 font-mono text-5xl text-background">
            npx tla-ts
          </p>
        </div>
      </div>
    </main>
  );
};
