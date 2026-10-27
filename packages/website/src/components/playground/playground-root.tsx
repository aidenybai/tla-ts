import { useRef, useState, type ReactNode } from "react";
import { EXAMPLES } from "../../examples";
import { useCheck } from "../../hooks/use-check";
import { PlaygroundContext } from "./playground-context";

interface RootProps {
  children: ReactNode;
}

export const Root = (props: RootProps) => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isResultShown, setIsResultShown] = useState(false);
  const check = useCheck();
  // The editors own their text, so edits only need reading when Check runs.
  const specRef = useRef(EXAMPLES[0].spec);
  const configRef = useRef(EXAMPLES[0].config);

  const selectExample = (index: number) => {
    check.reset();
    setIsResultShown(false);
    setExampleIndex(index);
    specRef.current = EXAMPLES[index].spec;
    configRef.current = EXAMPLES[index].config;
  };

  const runCheck = () => {
    setIsResultShown(true);
    check.run({ spec: specRef.current, config: configRef.current });
  };

  return (
    <PlaygroundContext
      value={{
        example: EXAMPLES[exampleIndex],
        exampleIndex,
        isResultShown,
        specRef,
        configRef,
        check,
        setIsResultShown,
        selectExample,
        runCheck,
      }}
    >
      <div className="flex h-[80dvh] flex-col overflow-hidden rounded-2xl bg-white shadow-custom lg:h-full">
        {props.children}
      </div>
    </PlaygroundContext>
  );
};
