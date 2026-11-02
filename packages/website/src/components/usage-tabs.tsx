import { Tabs } from "@base-ui/react/tabs";
import { CodeBlock } from "./code-block";

const TAB_CLASS_NAME =
  "relative z-10 rounded-md px-2.5 text-sm/6 text-gray-1000 outline-none hover:text-gray-1200 focus-visible:ring-2 focus-visible:ring-blue-500/40 data-active:text-gray-1200";
interface UsageTabsProps {
  cli: string;
  api: string;
}

export const UsageTabs = ({ cli, api }: UsageTabsProps) => (
  <Tabs.Root defaultValue="cli" className="flex flex-col gap-2">
    <Tabs.List className="relative flex w-fit gap-0.5 rounded-lg bg-gray-300 p-0.5">
      <Tabs.Tab value="cli" className={TAB_CLASS_NAME}>
        CLI
      </Tabs.Tab>
      <Tabs.Tab value="api" className={TAB_CLASS_NAME}>
        API
      </Tabs.Tab>
      <Tabs.Indicator className="absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-white shadow-custom transition-[left,width] duration-200" />
    </Tabs.List>
    <Tabs.Panel value="cli" className="outline-none">
      <CodeBlock language="shell" code={cli} />
    </Tabs.Panel>
    <Tabs.Panel value="api" className="outline-none">
      <CodeBlock language="typescript" code={api} />
    </Tabs.Panel>
  </Tabs.Root>
);
