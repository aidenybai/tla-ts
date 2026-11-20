import tutorial from "virtual:tutorial";
import { Content } from "@/components/content";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { InlineCode } from "@/components/ui/inline-code";
import { Link } from "@/components/ui/link";

const Page = () => (
  <main className="mx-auto max-w-[692px] px-6 py-16 text-prose sm:py-28">
    <Hero.Root>
      <Hero.Title>TLA+ for TypeScript programmers</Hero.Title>
      <Hero.Body>
        <p>
          <Link href="https://github.com/tlaplus/tlaplus">TLA+</Link> is a language that describes
          what a system can do. A model checker then visits every state that the description allows.
        </p>
        <p>
          This guide puts each piece of TLA+ syntax next to the TypeScript you already write.{" "}
          <Link href="/">TLA-ts</Link> writes the TLA+ for you, so read on to understand its output
          or to write a spec by hand.
        </p>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-20 flex flex-col gap-20">
      <Content sections={tutorial} />
      <Section.Root>
        <Section.Title>Next steps</Section.Title>
        <p className="text-pretty">
          You can skip the TLA+ and check the TypeScript directly: write the like button as{" "}
          <InlineCode>likes.ts</InlineCode> and run <InlineCode>npx tla-ts likes.ts</InlineCode>.
          The <Link href="/playground">playground</Link> shows each TypeScript file beside the TLA+
          that TLA-ts writes for it.
        </p>
        <p className="text-pretty">
          For the rest of the language, read{" "}
          <Link href="https://lamport.azurewebsites.net/tla/summary-standalone.pdf">
            Leslie Lamport's summary of TLA+
          </Link>{" "}
          or <Link href="https://learntla.com">Learn TLA+</Link> by Hillel Wayne.
        </p>
      </Section.Root>
    </div>
    <Footer />
  </main>
);

export default Page;
