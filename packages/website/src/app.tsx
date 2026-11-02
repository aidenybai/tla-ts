import { CodeBlock } from "./components/code-block";
import { ExampleTabs } from "./components/example-tabs";
import { PROOF_EXAMPLES, SPEC_EXAMPLES } from "./examples";

const LINK_CLASS_NAME =
  "text-gray-1200 underline decoration-gray-700 underline-offset-[3px] hover:decoration-gray-1200";
const HEADING_CLASS_NAME = "mt-5 font-semibold text-gray-1200 first:mt-0";

export const App = () => (
  <main className="mx-auto max-w-2xl px-4 pt-12 pb-24 text-paragraph sm:px-6 sm:pt-24">
    <h1 className="text-2xl font-semibold text-gray-1200">tla-ts</h1>
    <div className="mt-3 flex flex-col gap-4 text-pretty">
      <p>
        tla-ts is a drop-in replacement for{" "}
        <a href="https://lamport.azurewebsites.net/tla/tools.html" className={LINK_CLASS_NAME}>
          TLC
        </a>{" "}
        that's 2× faster.
      </p>
      <p>
        TLA+ lets you write formal models of a system, and TLC model checks them. But TLC is written
        in Java and needs the JVM. tla-ts runs anywhere JavaScript runs, such as the browser, Node
        and Bun.
      </p>
      <p>
        <a href="https://github.com/aidenybai/tla-ts" className={LINK_CLASS_NAME}>
          Source on GitHub
        </a>
      </p>
    </div>
    <div className="mt-10 flex flex-col gap-3">
      <h2 className={HEADING_CLASS_NAME}>Install</h2>
      <CodeBlock language="shell" code="npm install tla-ts" />
      <h2 className={HEADING_CLASS_NAME}>Check a spec</h2>
      <ExampleTabs examples={SPEC_EXAMPLES} />
      <h2 className={HEADING_CLASS_NAME}>Prove a theorem</h2>
      <ExampleTabs examples={PROOF_EXAMPLES} />
    </div>
  </main>
);
