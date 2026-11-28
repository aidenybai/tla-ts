import { useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createMazeScene, MAZE_MAP, type MazeView, type Square } from "./maze-scene";

const SKELETON_WALLS = MAZE_MAP.flatMap((row, y) =>
  [...row].flatMap((kind, x) => (kind === "#" ? [{ x, y }] : [])),
);

interface MazeBoardProps {
  view: MazeView;
  label: string;
  onPick?: (square: Square) => void;
  className?: string;
  children?: ReactNode;
}

export const MazeBoard = (props: MazeBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boardRef, { amount: 0.5 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawn, setIsDrawn] = useState(false);
  const sceneRef = useRef<ReturnType<typeof createMazeScene>>(undefined);
  const viewRef = useRef(props.view);
  useEffect(() => {
    viewRef.current = props.view;
  });
  useEffect(() => {
    if (!isInView || !canvasRef.current) return;
    sceneRef.current ??= createMazeScene(canvasRef.current, MAZE_MAP);
    const scene = sceneRef.current;
    if (!scene) return;
    let frame = requestAnimationFrame(function paint(now) {
      scene.draw(viewRef.current, now);
      setIsDrawn(true);
      frame = requestAnimationFrame(paint);
    });
    return () => cancelAnimationFrame(frame);
  }, [isInView]);
  const onPick = props.onPick;
  return (
    <div
      ref={boardRef}
      className={cn(
        "relative w-full touch-manipulation overflow-hidden rounded-lg select-none",
        props.className,
      )}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={props.label}
        onClick={
          onPick &&
          ((event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const square = sceneRef.current?.pick(
              (event.clientX - box.left) / box.width,
              (event.clientY - box.top) / box.height,
            );
            if (square) onPick(square);
          })
        }
        className={cn("relative block aspect-[20/19] w-full", onPick && "cursor-pointer")}
      />
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
      {props.children}
    </div>
  );
};
