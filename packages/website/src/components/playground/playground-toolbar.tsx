import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { EXAMPLES } from "../../examples";
import { usePlayground } from "./playground-context";

interface ToolbarProps {
  children: ReactNode;
}

const TAB_CLASS_NAME =
  "h-7 rounded-full px-3 text-sm font-medium text-gray-1100 hover:text-gray-1200 aria-pressed:bg-white aria-pressed:text-gray-1200 aria-pressed:shadow-custom";

export const Toolbar = (props: ToolbarProps) => (
  <header className="flex items-center gap-2 p-3">{props.children}</header>
);

export const Tabs = () => {
  const playground = usePlayground();
  return (
    <nav className="mr-auto flex shrink-0 rounded-full bg-gray-300 p-0.5">
      <button
        type="button"
        aria-pressed={!playground.isResultShown}
        className={TAB_CLASS_NAME}
        onClick={() => playground.setIsResultShown(false)}
      >
        Code
      </button>
      <button
        type="button"
        aria-pressed={playground.isResultShown}
        className={TAB_CLASS_NAME}
        onClick={() => playground.setIsResultShown(true)}
      >
        Trace
      </button>
    </nav>
  );
};

export const SpecSelect = () => {
  const playground = usePlayground();
  return (
    <label className="relative flex h-8 min-w-0 items-center rounded-full bg-gray-300 text-sm font-medium text-gray-1200 hover:bg-gray-400">
      <select
        aria-label="Spec"
        value={playground.exampleIndex}
        onChange={(event) => playground.selectExample(Number(event.target.value))}
        className="h-full min-w-0 cursor-pointer appearance-none truncate rounded-full bg-transparent pr-8 pl-3.5 outline-none"
      >
        {EXAMPLES.map((example, index) => (
          <option key={example.name} value={index}>
            {example.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 size-4 text-gray-1100"
      />
    </label>
  );
};

export const CheckButton = () => {
  const playground = usePlayground();
  return (
    <button
      type="button"
      onClick={playground.check.isRunning ? playground.check.stop : playground.runCheck}
      className="h-8 shrink-0 rounded-full bg-gray-1200 px-3.5 text-sm font-medium text-white select-none hover:bg-black active:scale-[0.97]"
    >
      {playground.check.isRunning ? "Stop" : "Check"}
    </button>
  );
};
