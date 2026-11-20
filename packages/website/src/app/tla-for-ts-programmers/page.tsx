import tutorial from "virtual:tutorial";
import { Content } from "@/components/content";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { Link } from "@/components/ui/link";

const Page = () => (
  <main className="mx-auto max-w-[692px] px-6 py-16 text-prose sm:py-28">
    <Hero.Root>
      <Hero.Title>TLA+ for TypeScript programmers</Hero.Title>
      <Hero.Body>
        <p>
          Learn to read and write <Link href="https://github.com/tlaplus/tlaplus">TLA+</Link> by
          translating one TypeScript file.
        </p>
      </Hero.Body>
    </Hero.Root>
    <div className="mt-20 flex flex-col gap-20">
      <Content sections={tutorial} />
      <Section.Root>
        <Section.Title>Next steps</Section.Title>
        <p className="text-pretty">
          The <Link href="/playground">playground</Link> shows more TypeScript files beside the TLA+
          that <Link href="/">TLA-ts</Link> writes for them.
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
