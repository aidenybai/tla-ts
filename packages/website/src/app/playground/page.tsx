import { Playground } from "@/components/playground/playground";

const Page = () => (
  <Playground.Root>
    <Playground.Header>
      <Playground.Settings />
      <Playground.Files />
      <Playground.Run />
    </Playground.Header>
    <Playground.Workspace>
      <Playground.Result />
      <Playground.Arrows />
      <Playground.Panes source={<Playground.Source />} output={<Playground.Output />} />
    </Playground.Workspace>
  </Playground.Root>
);

export default Page;
