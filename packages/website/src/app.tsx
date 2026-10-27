import { Editor, type EditorFactory } from "@pierre/diffs/edit";
import { EditProvider } from "@pierre/diffs/react";
import { Playground } from "./components/playground/playground";

const LINK_CLASS_NAME =
  "font-medium text-gray-1200 underline decoration-gray-700 underline-offset-[3px] hover:decoration-gray-1200";

const createEditor: EditorFactory<undefined, undefined> = (type, options, editStateKey) =>
  new Editor(type, options, editStateKey);

export const App = () => (
  <EditProvider createEditor={createEditor}>
    <div className="lg:grid lg:h-dvh lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
      <main className="px-6 pt-12 text-paragraph sm:pt-24 lg:overflow-y-auto lg:pt-9 lg:pb-24 [&>p+p]:mt-4">
        <h1 className="text-2xl font-semibold text-gray-1200">tla-ts</h1>
        <p className="mb-8 text-gray-1000">TLA+ model checker in TypeScript</p>
        <p className="text-pretty">
          tla-ts is a drop-in replacement for{" "}
          <a href="https://lamport.azurewebsites.net/tla/tools.html" className={LINK_CLASS_NAME}>
            TLC
          </a>{" "}
          and a full interpreter and model checker for TLA+, written in TypeScript. It runs in Node,
          Bun and the browser, and it's 2× faster than TLC.
        </p>
        <p>
          <a href="https://github.com/aidenybai/tla-ts" className={LINK_CLASS_NAME}>
            Source on GitHub
          </a>
        </p>
      </main>
      <section className="px-6 pt-8 pb-12 lg:min-h-0 lg:py-6 lg:pl-0">
        <Playground.Root>
          <Playground.Toolbar>
            <Playground.SpecSelect />
            <span className="flex-1" />
            <Playground.Status />
            <Playground.CheckButton />
          </Playground.Toolbar>
          <Playground.CodePane />
          <Playground.ResultDrawer />
        </Playground.Root>
      </section>
    </div>
  </EditProvider>
);
