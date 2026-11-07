// backend/smtlib.ml's layout of an SMT-LIB command: each s-expression is a Format box, so a long
// term breaks across lines the way it does in the files tlapm writes.

import { format, renderDoc, text, type Doc } from "../../obligations/format";

type Sexp = string | Sexp[];

const parseSexp = (command: string): Sexp => {
  const tokens = command.match(/\|[^|]*\||[()]|[^\s()|]+/g) ?? [];
  const stack: Sexp[][] = [[]];
  tokens.forEach((token) => {
    if (token === "(") {
      stack.push([]);
      return;
    }
    if (token === ")") {
      const done = stack.pop() ?? [];
      stack.at(-1)?.push(done);
      return;
    }
    stack.at(-1)?.push(token);
  });
  return stack[0][0];
};

const printFlat = (sexp: Sexp): string =>
  typeof sexp === "string" ? sexp : `(${sexp.map(printFlat).join(" ")})`;

// pp_print_sexpr.
const printSexpr = (...docs: Doc[]): Doc => [format("@[<hov2>("), docs, format("@])")];

// pp_box.
const printBox = (doc: Doc) => format("@[<hov0>%a@]", doc);

// pp_print_delimited ~sep:pp_print_space.
const printSpaced = (docs: Doc[]) =>
  docs.flatMap((doc, index) => (index === 0 ? [doc] : [format("@ "), doc]));

const getList = (sexp: Sexp | undefined) => (Array.isArray(sexp) ? sexp : []);

// An annotation's attributes: each :pattern prints its terms as a list, and :named its name.
const printAttributes = (attributes: Sexp[]): Doc[] =>
  attributes.flatMap((attribute, index) => {
    if (index % 2 === 1) return [];
    const value = attributes[index + 1] ?? "";
    return attribute === ":pattern"
      ? [[text(":pattern "), printSexpr(printSpaced(getList(value).map(printTerm)))]]
      : [text(`${printFlat(attribute)} ${printFlat(value)}`)];
  });

const printTerm = (sexp: Sexp): Doc => printBox(printExpression(sexp));

// fmt_expr and pp_apply.
const printExpression = (sexp: Sexp): Doc => {
  if (typeof sexp === "string") return text(sexp);
  const head = printFlat(sexp[0]);
  const args = sexp.slice(1);
  if (head === "forall" || head === "exists")
    return printSexpr(
      text(head),
      format("@ "),
      printSexpr(printSpaced(getList(args[0]).map((binding) => text(printFlat(binding))))),
      format("@ "),
      printTerm(args[1]),
    );
  if (head === "let")
    return printSexpr(
      text("let "),
      printSexpr(
        printSpaced(
          getList(args[0]).map((binding) => {
            const parts = getList(binding);
            return [text(`(${printFlat(parts[0])} `), printExpression(parts[1]), text(")")];
          }),
        ),
      ),
      format("@ "),
      printTerm(args[1]),
    );
  if (head === "!")
    return printSexpr(
      text("!"),
      format("@ "),
      printTerm(args[0]),
      format("@ "),
      printSpaced(printAttributes(args.slice(1))),
    );
  return printSexpr(text(head), format("@ "), printSpaced(args.map(printTerm)));
};

// pp_print_declarefun and pp_print_assert; other commands print on one line.
export const layOutCommand = (command: string) => {
  const sexp = getList(parseSexp(command));
  const head = sexp[0];
  if (head === "declare-fun")
    return renderDoc(
      printSexpr(
        text(`declare-fun ${printFlat(sexp[1])} (`),
        printSpaced(getList(sexp[2]).map((sort) => text(printFlat(sort)))),
        text(`) ${printFlat(sexp[3])}`),
      ),
    );
  if (head === "assert")
    return renderDoc(printSexpr(text("assert"), format("@ "), printTerm(sexp[1])));
  return command;
};
