import type { ViewFile } from "@/model";

const PALETTE = [
  "rgb(25, 133, 255)",
  "rgb(174, 97, 174)",
  "rgb(255, 97, 106)",
  "rgb(250, 192, 61)",
  "rgb(115, 192, 88)",
];

// Each state variable and definition takes the next color in the order the module defines them,
// so that neighbors in the TLA+ differ.
export const getColorByNodeId = (view: ViewFile): Map<string, string> => {
  const names = [
    ...new Set(
      view.nodes
        .filter((node) => node.pane === "module")
        .toSorted((left, right) => left.loc.start.index - right.loc.start.index)
        .map((node) => node.name),
    ),
  ];
  return new Map(
    view.nodes.flatMap((node) => {
      const index = names.indexOf(node.name);
      return index === -1 ? [] : [[node.id, PALETTE[index % PALETTE.length]!] as const];
    }),
  );
};
