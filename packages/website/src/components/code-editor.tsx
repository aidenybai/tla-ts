import { useRef } from "react";
import { getHighlightedLines } from "../highlighter";
import { getLineOffsets } from "../line-offsets";
import type { Mark } from "../site-data";
import { CodeLine } from "./code-line";

interface CodeEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  marks: Mark[];
  hoveredName: string | undefined;
  colors: Record<string, string>;
  onHover: (name: string | undefined) => void;
}

export const CodeEditor = (props: CodeEditorProps) => {
  const characterRef = useRef<HTMLSpanElement>(null);
  const lines = props.value.split("\n");
  const offsets = getLineOffsets(lines);
  return (
    <div className="grid w-max min-w-full font-mono text-[13px]/[1.7] text-foreground">
      <span ref={characterRef} aria-hidden className="invisible absolute">
        0
      </span>
      <code aria-hidden className="pointer-events-none [grid-area:1/1]">
        {getHighlightedLines(props.value, "typescript")
          .map((tokens, index) => ({ tokens, index }))
          .map((line) => (
            <CodeLine
              key={line.index}
              tokens={line.tokens}
              isWrapped={false}
              offset={offsets[line.index]}
              marks={props.marks}
              hoveredName={props.hoveredName}
              colors={props.colors}
              className="w-max"
            />
          ))}
      </code>
      <textarea
        aria-label={props.label}
        value={props.value}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => props.onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || event.shiftKey) return;
          event.preventDefault();
          const textarea = event.currentTarget;
          textarea.setRangeText("  ", textarea.selectionStart, textarea.selectionEnd, "end");
          props.onChange(textarea.value);
        }}
        onPointerMove={(event) => {
          const character = characterRef.current;
          if (character === null) return;
          const box = event.currentTarget.getBoundingClientRect();
          const size = character.getBoundingClientRect();
          const lineIndex = Math.floor((event.clientY - box.top) / size.height);
          const column = Math.floor((event.clientX - box.left) / size.width);
          const offset =
            column < (lines[lineIndex]?.length ?? 0) ? offsets[lineIndex] + column : undefined;
          props.onHover(
            props.marks.find(
              (mark) => offset !== undefined && mark.start <= offset && offset < mark.end,
            )?.name,
          );
        }}
        onPointerLeave={() => props.onHover(undefined)}
        className="resize-none overflow-hidden bg-transparent whitespace-pre text-transparent caret-foreground outline-none [grid-area:1/1] selection:bg-foreground/15"
      />
    </div>
  );
};
