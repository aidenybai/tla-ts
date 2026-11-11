import { reference } from "virtual:site-data";
import type { ReferenceBlock } from "../site-data";
import { CodeActions, CodeContent, CodeCopy, CodeRoot } from "./code";
import { SectionRoot, SectionTitle } from "./section";
import { InlineCode } from "./ui/inline-code";

interface TextProps {
  text: string;
}

const Text = (props: TextProps) =>
  props.text
    .split("`")
    .map((part, index) => ({ part, isCode: index % 2 === 1, offset: index }))
    .map((piece) =>
      piece.isCode ? <InlineCode key={piece.offset}>{piece.part}</InlineCode> : piece.part,
    );

interface BlockProps {
  block: ReferenceBlock;
}

const Block = (props: BlockProps) => {
  const block = props.block;
  if (block.kind === "heading") {
    return (
      <h3 className="mt-2 scroll-m-4 text-foreground">
        <Text text={block.text} />
      </h3>
    );
  }
  if (block.kind === "paragraph") {
    return (
      <p className="text-pretty">
        <Text text={block.text} />
      </p>
    );
  }
  if (block.kind === "code") {
    return (
      <CodeRoot source={block.source}>
        <CodeContent />
        <CodeActions>
          <CodeCopy />
        </CodeActions>
      </CodeRoot>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b text-faint">
            {block.header.map((cell) => (
              <th key={cell} className="py-2 pr-4 font-normal">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row[0]} className="border-b last:border-b-0">
              {row.map((cell) => (
                <td key={cell} className="py-2 pr-4 align-top first:whitespace-nowrap">
                  <Text text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Reference = () =>
  reference.map((section) => (
    <SectionRoot key={section.title}>
      <SectionTitle>{section.title}</SectionTitle>
      {section.blocks
        .map((block, index) => ({ block, order: index }))
        .map((item) => (
          <Block key={item.order} block={item.block} />
        ))}
    </SectionRoot>
  ));
