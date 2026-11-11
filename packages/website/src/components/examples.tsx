import { Tabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import { createPartsContext } from "@/lib/utils";
import type { Example } from "../examples";
import { CodeActions, CodeContent, CodeCopy, CodeRoot, CodeRun, CodeStatus } from "./code";
import {
  RunDrawerClose,
  RunDrawerControls,
  RunDrawerHeader,
  RunDrawerRoot,
  RunDrawerRows,
  RunDrawerTitle,
  RunDrawerTrace,
} from "./run-drawer";
import { TabList } from "./tab-list";

const USAGE_TABS = [
  { value: "cli", label: "CLI" },
  { value: "api", label: "API" },
];

const examplesContext = createPartsContext<Example[]>("Examples.Root");
const exampleContext = createPartsContext<Example>("Examples.Panels");

interface RootProps {
  examples: Example[];
  children: ReactNode;
}

export const ExamplesRoot = (props: RootProps) => (
  <examplesContext.PartsContext value={props.examples}>
    <Tabs.Root defaultValue={props.examples[0].name} className="flex flex-col gap-3">
      {props.children}
    </Tabs.Root>
  </examplesContext.PartsContext>
);

export const ExamplesList = () => {
  const examples = examplesContext.useParts();
  return (
    <TabList tabs={examples.map((example) => ({ value: example.name, label: example.name }))} />
  );
};

interface PanelsProps {
  children: ReactNode;
}

export const ExamplesPanels = (props: PanelsProps) => {
  const examples = examplesContext.useParts();
  return (
    <>
      {examples.map((example) => (
        <Tabs.Panel
          key={example.name}
          value={example.name}
          className="flex flex-col gap-3 outline-none"
        >
          <exampleContext.PartsContext value={example}>
            {props.children}
          </exampleContext.PartsContext>
        </Tabs.Panel>
      ))}
    </>
  );
};

export const ExamplesDescription = () => {
  const example = exampleContext.useParts();
  return <p className="text-pretty">{example.description}</p>;
};

export const ExamplesSource = () => {
  const example = exampleContext.useParts();
  return (
    <CodeRoot language="tla" code={example.source}>
      <CodeContent />
      <CodeActions>
        <CodeStatus />
        <CodeRun request={example.run} />
        <CodeCopy />
      </CodeActions>
      <RunDrawerRoot>
        <RunDrawerHeader>
          <RunDrawerTitle />
          <RunDrawerControls />
          <RunDrawerClose />
        </RunDrawerHeader>
        <RunDrawerTrace />
        <RunDrawerRows />
      </RunDrawerRoot>
    </CodeRoot>
  );
};

export const ExamplesUsage = () => {
  const example = exampleContext.useParts();
  return (
    <Tabs.Root defaultValue="cli" className="flex flex-col gap-2">
      <TabList tabs={USAGE_TABS} />
      <Tabs.Panel value="cli" className="outline-none">
        <CodeRoot language="shell" code={example.cli}>
          <CodeContent />
          <CodeActions>
            <CodeCopy />
          </CodeActions>
        </CodeRoot>
      </Tabs.Panel>
      <Tabs.Panel value="api" className="outline-none">
        <CodeRoot language="typescript" code={example.api}>
          <CodeContent />
          <CodeActions>
            <CodeCopy />
          </CodeActions>
        </CodeRoot>
      </Tabs.Panel>
    </Tabs.Root>
  );
};
