import type { RegionKind } from "../../../tla-ts/src/typescript/emit";
import type { Token, TokenKind } from "./syntax";

export interface Link {
  name: string;
  kind: RegionKind;
  start: number;
  end: number;
}

interface Span {
  start: number;
  end: number;
}

interface Piece {
  start: number;
  text: string;
  token: TokenKind | undefined;
  // The links over the piece, innermost first.
  links: Link[];
}

export interface Line {
  number: number;
  pieces: Piece[];
  names: ReadonlySet<string>;
}

// The colors of Evan Wallace's source map visualization, as RGB channels.
const PALETTE = ["25 133 255", "174 97 174", "255 97 106", "250 192 61", "115 192 88"];

export const getColors = (names: Iterable<string>) =>
  new Map([...new Set(names)].map((name, index) => [name, PALETTE[index % PALETTE.length]]));

const getLength = (span: Span) => span.end - span.start;

const getLinksOver = (links: Link[], start: number, end: number) =>
  links
    .filter((link) => link.start <= start && link.end >= end)
    .toSorted((left, right) => getLength(left) - getLength(right));

export const getLinkAt = (links: Link[], start: number, end = start): Link | undefined =>
  getLinksOver(links, start, end)[0];

export const getLines = (text: string, tokens: Token[], links: Link[]): Line[] => {
  const tokenOwners = tokens.reduce(
    (owners, token) => owners.fill(token, token.start, token.end),
    Array.from<Token | undefined>({ length: text.length }),
  );
  const boundaries = [
    ...new Set([
      0,
      text.length,
      ...[...text.matchAll(/\n/g)].flatMap((match) => [match.index, match.index + 1]),
      ...tokens.flatMap((token) => [token.start, token.end]),
      ...links.flatMap((link) => [link.start, link.end]),
    ]),
  ].toSorted((left, right) => left - right);
  const pieces = boundaries.slice(0, -1).map((start, index): Piece => ({
    start,
    text: text.slice(start, boundaries[index + 1]),
    token: tokenOwners[start]?.kind,
    links: getLinksOver(links, start, boundaries[index + 1]),
  }));
  const lines = pieces.reduce<Piece[][]>(
    (grouped, piece) => {
      if (piece.text === "\n") grouped.push([]);
      else grouped[grouped.length - 1].push(piece);
      return grouped;
    },
    [[]],
  );
  return lines.map((linePieces, index) => ({
    number: index + 1,
    pieces: linePieces,
    names: new Set(linePieces.flatMap((piece) => piece.links.map((link) => link.name))),
  }));
};

export const getNameLinks = (
  text: string,
  tokens: Token[],
  kinds: ReadonlyMap<string, RegionKind>,
): Link[] =>
  tokens.flatMap((token) => {
    const name = text.slice(token.start, token.end);
    const kind = kinds.get(name);
    const isField =
      text[token.start - 1] === "." || /^\s*\|->/.test(text.slice(token.end, token.end + 6));
    return token.kind !== "name" || kind === undefined || isField
      ? []
      : [{ name, kind, start: token.start, end: token.end }];
  });
