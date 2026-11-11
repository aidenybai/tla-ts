import { Tabs } from "@base-ui/react/tabs";

interface TabListProps {
  tabs: { value: string; label: string }[];
}

export const TabList = (props: TabListProps) => (
  <Tabs.List className="relative flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg bg-gray-300 p-0.5">
    {props.tabs.map((tab) => (
      <Tabs.Tab
        key={tab.value}
        value={tab.value}
        className="relative z-10 shrink-0 rounded-md px-2.5 text-sm/6 text-gray-1000 outline-none hover:text-gray-1200 focus-visible:ring-2 focus-visible:ring-blue-500/40 data-active:text-gray-1200"
      >
        {tab.label}
      </Tabs.Tab>
    ))}
    <Tabs.Indicator className="absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-surface-raised shadow-custom transition-[left,width] duration-200" />
  </Tabs.List>
);
