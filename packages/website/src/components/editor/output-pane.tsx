import { useMemo, useRef } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { getLines, type Link } from "@/lib/regions";
import { getTokens } from "@/lib/syntax";
import { cn } from "@/lib/utils";
import { CodePane } from "./code-pane";
import { getNameAtPoint, LinkedLines, useScrollToSelection } from "./linked-lines";
import { Outline } from "./outline";
import { Pane } from "./pane";
import { useActiveName, useHighlight, useViewer } from "./viewer-context";

interface OutputCodeProps {
  text: string;
  links: Link[];
}

const OutputCode = ({ text, links }: OutputCodeProps) => {
  const viewer = useViewer();
  const highlight = useHighlight();
  const activeName = useActiveName();
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollToSelection(scrollRef, "output");
  const lines = useMemo(() => getLines(text, getTokens(text, "tla"), links), [text, links]);
  return (
    <Pane.Body
      ref={scrollRef}
      onMouseMove={(event) => highlight.setHovered(getNameAtPoint(event.clientX, event.clientY))}
      onMouseLeave={() => highlight.setHovered(undefined)}
      onClick={(event) => {
        const name = getNameAtPoint(event.clientX, event.clientY);
        highlight.select(name === undefined ? undefined : { name, origin: "output" });
      }}
    >
      <CodePane
        lineCount={lines.length}
        isWrapped={viewer.isWrapped}
        data-has-active={activeName !== undefined || undefined}
      >
        <LinkedLines lines={lines} />
      </CodePane>
    </Pane.Body>
  );
};

const ErrorMessage = () => {
  const error = useViewer().error;
  return (
    error !== undefined && (
      <pre
        role="alert"
        className="max-h-40 shrink-0 overflow-auto border-b border-rule bg-alarm/8 px-3 py-2 font-mono text-[12px]/5 whitespace-pre-wrap text-alarm"
      >
        {error}
      </pre>
    )
  );
};

export const OutputPane = () => {
  const viewer = useViewer();
  const spec = viewer.compilation?.spec;
  const isStale = viewer.error !== undefined;
  return (
    <Pane className="border-t border-rule md:border-t-0 md:border-l">
      <Pane.Header>
        {spec === undefined
          ? "Compiling…"
          : viewer.view === "config"
            ? `${spec.name}.cfg`
            : viewer.view === "outline"
              ? `${spec.name} outline`
              : `${spec.name}.tla`}
      </Pane.Header>
      <ErrorMessage />
      {spec !== undefined && (
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
            isStale && "opacity-60",
          )}
        >
          <TabsContent value="tla" className="flex min-h-0 flex-1 flex-col">
            <OutputCode text={spec.source} links={viewer.outputLinks} />
          </TabsContent>
          <TabsContent value="config" className="flex min-h-0 flex-1 flex-col">
            <OutputCode text={spec.config} links={viewer.configLinks} />
          </TabsContent>
          <TabsContent value="outline" className="min-h-0 flex-1">
            <Outline>
              <Outline.Variables />
              <Outline.Actions />
              <Outline.Checks />
              <Outline.Definitions />
            </Outline>
          </TabsContent>
        </div>
      )}
    </Pane>
  );
};
