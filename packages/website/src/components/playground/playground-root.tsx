import { useRef, useState, type ReactNode } from "react";
import { EXAMPLES } from "../../examples";
import { useCheck } from "../../hooks/use-check";
import { PlaygroundContext } from "./playground-context";

interface RootProps {
  children: ReactNode;
}

export const Root = (props: RootProps) => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // The results drawer renders inside the playground, not over the whole page.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const check = useCheck();
  // The editors own their text, so edits only need reading when Check runs.
  const specRef = useRef(EXAMPLES[0].spec);
  const configRef = useRef(EXAMPLES[0].config);

  const selectExample = (index: number) => {
    check.reset();
    setIsDrawerOpen(false);
    setExampleIndex(index);
    specRef.current = EXAMPLES[index].spec;
    configRef.current = EXAMPLES[index].config;
  };

  const runCheck = () => {
    setIsDrawerOpen(false);
    check.run({ spec: specRef.current, config: configRef.current }, () => setIsDrawerOpen(true));
  };

  return (
    <PlaygroundContext
      value={{
        example: EXAMPLES[exampleIndex],
        exampleIndex,
        container,
        isDrawerOpen,
        specRef,
        configRef,
        check,
        setIsDrawerOpen,
        selectExample,
        runCheck,
      }}
    >
      <div
        ref={setContainer}
        className="relative flex h-[80dvh] flex-col overflow-hidden rounded-2xl bg-white shadow-custom lg:h-full"
      >
        {props.children}
      </div>
    </PlaygroundContext>
  );
};
