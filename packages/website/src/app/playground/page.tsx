import { Playground } from "@/components/playground/playground";
import { startEscoreWorker } from "@/lib/escore-worker";

// The checker loads ESCore as the page's code loads, before the page renders.
startEscoreWorker();

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
