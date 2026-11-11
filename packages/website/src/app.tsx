import "./index.css";
import { Code, Examples, Hero, Section } from "./components/parts";
import { ThemeToggle } from "./components/theme-toggle";
import { PROOF_EXAMPLES, SPEC_EXAMPLES } from "./examples";

export const App = () => (
  <main className="mx-auto max-w-2xl px-4 pt-12 pb-24 text-paragraph sm:px-6 sm:pt-24">
    <Hero.Root>
      <Hero.Header>
        <Hero.Title>tla-ts</Hero.Title>
        <ThemeToggle />
      </Hero.Header>
      <Hero.Body>
        <p>
          tla-ts is a drop-in replacement for{" "}
          <Hero.Link href="https://lamport.azurewebsites.net/tla/tools.html">TLC</Hero.Link> that's
          2× faster.
        </p>
        <p>
          TLA+ lets you write formal models of a system, and TLC model checks them. But TLC is
          written in Java and needs the JVM. tla-ts runs anywhere JavaScript runs, such as the
          browser, Node and Bun.
        </p>
        <p>
          <Hero.Link href="https://github.com/aidenybai/tla-ts">Source on GitHub</Hero.Link>
        </p>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-10 flex flex-col gap-8">
      <Section.Root>
        <Section.Title>Install</Section.Title>
        <Code.Root language="shell" code="npm install tla-ts">
          <Code.Content />
          <Code.Actions>
            <Code.Copy />
          </Code.Actions>
        </Code.Root>
      </Section.Root>
      <Section.Root>
        <Section.Title>Check a spec</Section.Title>
        <Examples.Root examples={SPEC_EXAMPLES}>
          <Examples.List />
          <Examples.Panels>
            <Examples.Description />
            <Examples.Source />
            <Examples.Usage />
          </Examples.Panels>
        </Examples.Root>
      </Section.Root>
      <Section.Root>
        <Section.Title>Prove a theorem</Section.Title>
        <Examples.Root examples={PROOF_EXAMPLES}>
          <Examples.List />
          <Examples.Panels>
            <Examples.Description />
            <Examples.Source />
            <Examples.Usage />
          </Examples.Panels>
        </Examples.Root>
      </Section.Root>
    </div>
  </main>
);
