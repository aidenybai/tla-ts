import { Tabs } from "@base-ui/react/tabs";
import { CodeBlock } from "./code-block";
import { TabList } from "./tab-list";

const USAGE_TABS = [
  { value: "cli", label: "CLI" },
  { value: "api", label: "API" },
];

interface UsageTabsProps {
  cli: string;
  api: string;
}

export const UsageTabs = (props: UsageTabsProps) => (
  <Tabs.Root defaultValue="cli" className="flex flex-col gap-2">
    <TabList tabs={USAGE_TABS} />
    <Tabs.Panel value="cli" className="outline-none">
      <CodeBlock language="shell" code={props.cli} />
    </Tabs.Panel>
    <Tabs.Panel value="api" className="outline-none">
      <CodeBlock language="typescript" code={props.api} />
    </Tabs.Panel>
  </Tabs.Root>
);
