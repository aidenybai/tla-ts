import { Tabs } from "@base-ui/react/tabs";
import type { Example } from "../examples";
import { CodeBlock } from "./code-block";
import { TabList } from "./tab-list";
import { UsageTabs } from "./usage-tabs";

interface ExampleTabsProps {
  examples: Example[];
}

export const ExampleTabs = (props: ExampleTabsProps) => (
  <Tabs.Root defaultValue={props.examples[0].name} className="flex flex-col gap-3">
    <TabList
      tabs={props.examples.map((example) => ({ value: example.name, label: example.name }))}
    />
    {props.examples.map((example) => (
      <Tabs.Panel
        key={example.name}
        value={example.name}
        className="flex flex-col gap-3 outline-none"
      >
        <p className="text-pretty">{example.description}</p>
        <CodeBlock language="tla" code={example.source} run={example.run} />
        <UsageTabs cli={example.cli} api={example.api} />
      </Tabs.Panel>
    ))}
  </Tabs.Root>
);
