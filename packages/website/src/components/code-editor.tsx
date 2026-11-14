import { useMemo, useRef } from "react";
import { getHighlightedLines } from "../highlighter";
import { getLineMarks } from "../line-marks";
import type { Mark } from "../site-data";
import { CodeLine, LineNumber } from "./code-line";

interface CodeEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  marks: Mark[];
  hoveredName: string | undefined;
  isHighlighted: boolean;
  focusedNames: string[];
  colors: Record<string, string>;
  onHover: (name: string | undefined) => void;
}

export const CodeEditor = (props: CodeEditorProps) => {
  const characterRef = useRef<HTMLSpanElement>(null);
  const lines = props.value.split("\n");
  const lineMarks = useMemo(
    () => getLineMarks(props.value.split("\n"), props.marks),
    [props.value, props.marks],
  );
  const highlighted = useMemo(() => getHighlightedLines(props.value, "typescript"), [props.value]);
  return (
    <div className="flex min-h-full w-max min-w-full gap-4 font-mono text-[13px]/[1.7] text-foreground pointer-coarse:text-[16px]/[1.7]">
      <span ref={characterRef} aria-hidden className="invisible absolute">
        0
      </span>
      <div>
        {lines
          .map((_line, index) => index + 1)
          .map((number) => (
            <LineNumber key={number} number={number} />
          ))}
      </div>
      <div className="grid flex-1">
        <code aria-hidden className="pointer-events-none [grid-area:1/1]">
          {highlighted
            .map((tokens, index) => ({ tokens, index }))
            .map((line) => (
              <CodeLine
                key={line.index}
                tokens={line.tokens}
                isWrapped={false}
                marks={lineMarks[line.index]}
                hoveredName={props.hoveredName}
                isHighlighted={props.isHighlighted}
                isDimmed={
                  props.focusedNames.length > 0 &&
                  !lineMarks[line.index].some((mark) => props.focusedNames.includes(mark.name))
                }
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
            props.onHover(
              column < (lines[lineIndex]?.length ?? 0)
                ? lineMarks[lineIndex].find((mark) => mark.start <= column && column < mark.end)
                    ?.name
                : undefined,
            );
          }}
          onPointerLeave={() => props.onHover(undefined)}
          className="resize-none overflow-hidden bg-transparent whitespace-pre text-transparent caret-foreground outline-none [grid-area:1/1] selection:bg-foreground/15"
        />
      </div>
    </div>
  );
};
