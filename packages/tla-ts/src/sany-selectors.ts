import type { Expression } from "./ast";
import type { TlcVersion } from "./tlc-version";
import {
  CONSTANT_DECL_KIND,
  getContextSymbol,
  getSymbolArity,
  type AssumeProveNode,
  type Context,
  type ExprNode,
  type ExprOrOpArgNode,
  type FactNode,
  type FormalParamNode,
  type LabelNode,
  type LevelNode,
  type OpApplNode,
  type OpArgNode,
  type OpDefNode,
  type SanyLocation,
  type SubstInNode,
  type SymbolNode,
  type ThmOrAssumpDefNode,
} from "./sany-nodes";

// A port of SANY's Generator.selectorToNode, which turns a name such as Op(a)!lab(b)!:!2 into the
// semantic node it names, following the Subexpression algorithm of SANY's Subexpression.tla.

// An operand selector !i is the number i, and the other selectors are named after SANY's NameSel,
// NullSel, GGSel, LLSel, ColonSel and AtSel.
type SelectorOp = number | "Name" | "Null" | ">>" | "<<" | ":" | "@";

export interface SelectorItem {
  op: SelectorOp;
  name: string;
  args: Expression[] | undefined;
  // Where SANY locates the selector and its parenthesized arguments, when known.
  location?: SanyLocation;
  argsLocation?: SanyLocation;
}

interface SelectorGenerator {
  version: TlcVersion | undefined;
  resolveSymbol: (name: string) => SymbolNode | undefined;
  resolveSynonym: (name: string) => string;
  generateExpression: (expression: Expression) => ExprNode;
  generateArgument: (operator: SymbolNode, index: number, argument: Expression) => ExprOrOpArgNode;
  createOpAppl: (
    operator: SymbolNode,
    operands: ExprOrOpArgNode[],
    location: SanyLocation,
  ) => OpApplNode;
  createOpArg: (op: SymbolNode, location: SanyLocation) => OpArgNode;
  createFormalParam: (
    name: string,
    arity: number,
    location: SanyLocation | undefined,
  ) => FormalParamNode;
  createLambda: (params: FormalParamNode[], body: ExprNode, location: SanyLocation) => OpDefNode;
  copySubstIn: (prefix: SubstInNode, body: ExprNode) => SubstInNode;
  getBuiltin: (name: string) => OpDefNode;
  // Errors.addMessage for an error SANY recovers from, and the null node SANY returns after one.
  addError: (location: SanyLocation, text: string) => OpApplNode;
  // Generator.illegalLabelRef and illegalAPPosRef: whether the node being generated lies outside
  // the scope of a declaration that a label or a clause of an ASSUME/PROVE lies in.
  isOutOfLabelScope: (label: LabelNode) => boolean;
  isOutOfClauseScope: (assumeProve: AssumeProveNode, position: number) => boolean;
}

const PROOF_STEP_OPERATORS = new Map([
  ["$Qed", "QED step"],
  ["$Pfcase", "CASE"],
  ["$Have", "HAVE"],
  ["$Take", "TAKE"],
  ["$Pick", "PICK"],
  ["$Witness", "WITNESS"],
  ["$Suffices", "SUFFICES"],
]);

// The parts of a name like I!Op or Op!lab, except for an operator such as !! that contains a "!".
const getNameParts = (name: string) => {
  const parts = name.split("!");
  return parts.some((part) => part.length === 0) ? [name] : parts;
};

// The selector of a name, an application of a name or a subexpression reference.
export const getSelectorItems = (expression: Expression): SelectorItem[] | undefined => {
  switch (expression.kind) {
    case "Identifier":
      return getNameParts(expression.name).map((name) => ({ op: "Name", name, args: undefined }));
    case "Apply": {
      const parts = getNameParts(expression.operator);
      const counts =
        expression.argumentCounts ??
        parts.map((_, index) => (index === parts.length - 1 ? expression.args.length : 0));
      const cursor = { value: 0 };
      return parts.map((name, index) => {
        const args = expression.args.slice(cursor.value, cursor.value + counts[index]);
        cursor.value += counts[index];
        return { op: "Name", name, args: args.length > 0 ? args : undefined };
      });
    }
    case "Subexpression":
      return expression.selectors.map((selector): SelectorItem => {
        switch (selector.kind) {
          case "Name":
            return {
              op: "Name",
              name: selector.name,
              args: selector.args.length > 0 ? selector.args : undefined,
            };
          case "Operand":
            return { op: selector.operand, name: String(selector.operand), args: undefined };
          case "Bound":
            return { op: "Null", name: "!(...)", args: selector.args };
          case "At":
            return { op: "@", name: "@", args: undefined };
          case "Colon":
            return { op: ":", name: ":", args: undefined };
        }
      });
  }
  return undefined;
};

// A selector SANY parses as a GeneralId rather than an OpApplication: one whose last part is not a
// name with arguments.
export const isGeneralId = (items: SelectorItem[]) => {
  const last = items[items.length - 1];
  return last.op !== "Name" || last.args === undefined;
};

// Subexpression.tla's ArgNum: the human number of the operand that a selector picks out of an
// expression with arity operands, or -1.
const getArgNumber = (op: SelectorOp, arity: number) => {
  if (typeof op === "number") return op > 0 && op <= arity ? op : -1;
  if (op === "<<") return arity > 0 ? 1 : -1;
  if (op === ">>") return arity === 2 ? 2 : -1;
  return -1;
};

type CurrentNode = LevelNode | SymbolNode | undefined;

type Mode = "FindingOpName" | "FollowingLabels" | "FindingSubExpr";

// The state of Generator.selectorToNode as it walks the items.
interface SelectorWalk {
  name: string | undefined;
  nameLocation: SanyLocation | undefined;
  node: CurrentNode;
  index: number;
  mode: Mode;
  previousMode: Mode | undefined;
  letInContext: Context | undefined;
  definitionArityFound: number;
  definitionArgs: ExprOrOpArgNode[];
  isInSuffices: boolean;
}

const isDeclarationLike = (node: SymbolNode) =>
  node.kind === "OpDecl" ||
  node.kind === "FormalParam" ||
  (node.kind === "OpDef" && (node.defKind === "BuiltIn" || node.defKind === "NumberedProofStep"));

const isSymbol = (node: LevelNode | SymbolNode): node is SymbolNode =>
  node.kind === "FormalParam" ||
  node.kind === "OpDecl" ||
  node.kind === "OpDef" ||
  node.kind === "ThmOrAssumpDef" ||
  node.kind === "Module";

// The symbols a quantifier binds: its bounded ones if it has any, else its unbounded ones.
const getQuantifierSymbols = (node: OpApplNode) =>
  (node.bounded?.length ?? 0) > 0 ? (node.bounded ?? []).flat() : (node.unbounded ?? []);

// Generator.extendedBy: a name's location grown to the end of its next part.
const extendLocation = (name: SanyLocation | undefined, part: SanyLocation): SanyLocation =>
  name === undefined ? part : { ...name, endLine: part.endLine, endColumn: part.endColumn };

export const createSelectorResolver = (generator: SelectorGenerator) => {
  // selectorToNode: with expectedArity 0 the expression a selector names, with a positive one the
  // operator argument, and with -1 the definition a DEF clause names. A fact can also be an
  // ASSUME/PROVE, a NEW clause or a module instance.
  return (
    items: SelectorItem[],
    expectedArity: number,
    isFact: boolean,
    isDef: boolean,
    location: SanyLocation,
  ): FactNode | ThmOrAssumpDefNode => {
    const substInPrefix: SubstInNode[] = [];
    const params: FormalParamNode[] = [];
    const allArgs: ExprOrOpArgNode[] = [];
    const getItemLocation = (itemIndex: number) => items[itemIndex].location ?? location;
    const walk: SelectorWalk = {
      name: undefined,
      nameLocation: undefined,
      node: undefined,
      index: 0,
      mode: "FindingOpName",
      previousMode: undefined,
      letInContext: undefined,
      definitionArityFound: 0,
      definitionArgs: [],
      isInSuffices: false,
    };
    const getArgs = (item: SelectorItem) => item.args ?? [];

    while (walk.index < items.length) {
      const item = items[walk.index];
      if (
        ((item.op !== "Name" && item.op !== "Null") || expectedArity !== 0) &&
        item.args !== undefined
      ) {
        return generator.addError(
          getItemLocation(walk.index),
          `Selector \`${item.name}' should not have argument(s).`,
        );
      }
      switch (walk.mode) {
        case "FindingOpName": {
          let symbol: SymbolNode | undefined;
          let newName: string | undefined;
          const collectedArgs: Expression[] = [];
          while (symbol === undefined && walk.index < items.length) {
            const current = items[walk.index];
            newName =
              current.op === "Name"
                ? walk.name === undefined
                  ? generator.resolveSynonym(current.name)
                  : `${walk.name}!${generator.resolveSynonym(current.name)}`
                : undefined;
            if (walk.name === undefined && current.op !== "Name") {
              return generator.addError(
                getItemLocation(walk.index),
                `Need name or step number here, not \`${current.name}'.`,
              );
            }
            if (newName !== undefined) {
              symbol =
                walk.letInContext === undefined
                  ? generator.resolveSymbol(newName)
                  : getContextSymbol(walk.letInContext, newName);
            }
            if (symbol === undefined) {
              if (newName !== undefined) {
                walk.name = newName;
                walk.nameLocation = extendLocation(walk.nameLocation, getItemLocation(walk.index));
              }
              collectedArgs.push(...getArgs(current));
              walk.index++;
            }
          }
          // TLC 1.7.4's SANY names only the last item of a selector it can't resolve, as
          // selectorItemToString does, which fails on an argument selector that isn't a number.
          if (symbol === undefined && generator.version === "1.7.4") {
            const last = items.length - 1;
            const item = items[last];
            const name = typeof item.op === "number" ? `argument selector ${item.name}` : item.name;
            return generator.addError(getItemLocation(last), `Unknown operator: \`${name}'.`);
          }
          if (symbol === undefined) {
            return generator.addError(
              walk.nameLocation ?? location,
              `Unknown operator: \`${walk.name}'.`,
            );
          }
          if (symbol.kind === "Module") {
            return generator.addError(
              getItemLocation(walk.index),
              `Module name (${items[walk.index].name}) not allowed here.`,
            );
          }
          walk.node = symbol;
          walk.nameLocation = extendLocation(walk.nameLocation, getItemLocation(walk.index));
          walk.name = newName;
          if (isDeclarationLike(symbol) && items.length !== 1) {
            return generator.addError(
              getItemLocation(walk.index),
              `Cannot take subexpression of \`${walk.name}'.`,
            );
          }
          const nodeArity = getSymbolArity(symbol);
          if (expectedArity === 0) {
            collectedArgs.push(...getArgs(items[walk.index]));
            if (walk.definitionArityFound + collectedArgs.length !== nodeArity) {
              return generator.addError(
                items[walk.index].argsLocation ?? location,
                `The operator ${walk.name} requires ${nodeArity - walk.definitionArityFound} arguments.`,
              );
            }
            collectedArgs.forEach((argument, argumentIndex) =>
              walk.definitionArgs.push(
                generator.generateArgument(
                  symbol,
                  argumentIndex + walk.definitionArityFound,
                  argument,
                ),
              ),
            );
          }
          walk.definitionArityFound = nodeArity;
          if (symbol.kind === "OpDef" && symbol.defKind === "ModuleInstance") {
            if (walk.index === items.length - 1 && !(isDef || isFact)) {
              return generator.addError(
                getItemLocation(walk.index),
                `Operator name ${walk.name} is incomplete.`,
              );
            }
          } else {
            const definition =
              (symbol.kind === "OpDef" && symbol.defKind === "UserDefined") ||
              symbol.kind === "ThmOrAssumpDef"
                ? symbol
                : undefined;
            if (
              symbol.kind === "OpDef" &&
              symbol.defKind === "UserDefined" &&
              !symbol.isDefined &&
              items.length !== 1
            ) {
              return generator.addError(
                getItemLocation(walk.index),
                `Subexpression of  \`${walk.name}' used inside the operator's definition.`,
              );
            }
            if (walk.index !== items.length - 1 && definition !== undefined) {
              params.push(...(definition.params ?? []));
              walk.name = undefined;
              walk.nameLocation = undefined;
              walk.mode =
                items[walk.index + 1].op === "Name" ? "FollowingLabels" : "FindingSubExpr";
              allArgs.push(...walk.definitionArgs);
              walk.definitionArityFound = 0;
              walk.definitionArgs = [];
              let body: LevelNode | undefined = definition.body;
              while (body?.kind === "SubstIn") {
                substInPrefix.push(body);
                body = body.body;
              }
              while (body?.kind === "APSubstIn") {
                substInPrefix.push(body);
                body = body.body;
              }
              if (walk.mode === "FindingSubExpr") walk.node = body;
            }
          }
          walk.previousMode = "FindingOpName";
          break;
        }
        case "FollowingLabels": {
          const owner = walk.node;
          const label =
            owner?.kind === "OpDef" || owner?.kind === "ThmOrAssumpDef" || owner?.kind === "Label"
              ? owner.labels.get(item.name)
              : undefined;
          if (label === undefined)
            return generator.addError(
              getItemLocation(walk.index),
              `Cannot find label \`${item.name}'.`,
            );
          walk.node = label;
          if (generator.isOutOfLabelScope(label)) {
            return generator.addError(
              getItemLocation(walk.index),
              `Accessing subexpression labeled \`${item.name}' of ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.`,
            );
          }
          if (expectedArity === 0) {
            if (label.params.length !== getArgs(item).length) {
              return generator.addError(
                getItemLocation(walk.index),
                `Label \`${item.name}' used with wrong number of arguments.`,
              );
            }
            allArgs.push(...getArgs(item).map(generator.generateExpression));
          }
          params.push(...label.params);
          if (walk.index < items.length - 1 && items[walk.index + 1].op !== "Name")
            walk.mode = "FindingSubExpr";
          if (walk.mode === "FindingSubExpr") walk.node = label.body;
          walk.previousMode = "FollowingLabels";
          break;
        }
        case "FindingSubExpr": {
          const node = walk.node;
          const nonexistent = () =>
            generator.addError(
              getItemLocation(walk.index),
              `Nonexistent operand specified by \`${item.name}'.`,
            );
          if (item.op === ":") {
            const isAllowed =
              walk.previousMode !== "FindingSubExpr" &&
              ((walk.index === items.length - 1 && walk.previousMode === "FindingOpName") ||
                (walk.index < items.length - 1 && items[walk.index + 1].op === "Name"));
            if (!isAllowed) {
              return generator.addError(
                getItemLocation(walk.index),
                "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
              );
            }
          } else if (node === undefined) {
            return generator.addError(
              getItemLocation(walk.index),
              "Subexpression selection failed, probably due to an error in the selected expression.",
            );
          } else if (node.kind === "LetIn") {
            if (getArgNumber(item.op, 1) !== 1)
              return generator.addError(
                getItemLocation(walk.index),
                "A LET/IN expression has only one operand.",
              );
            walk.node = node.body;
          } else if (node.kind === "OpAppl") {
            const operator = node.operator;
            const operands = node.operands;
            const isUserOperator =
              operator.kind === "FormalParam" ||
              (operator.kind === "OpDecl" && operator.declKind === CONSTANT_DECL_KIND) ||
              (operator.kind === "OpDef" && operator.defKind === "UserDefined");
            const notPair = () =>
              generator.addError(
                getItemLocation(walk.index),
                "Internal error: Expecting $Pair and didn't find it.",
              );
            const isPair = (pair: ExprOrOpArgNode | undefined): pair is OpApplNode =>
              pair?.kind === "OpAppl" && pair.operator.name === "$Pair";
            const operandNumber = getArgNumber(item.op, operands.length);
            if (isUserOperator) {
              const number = getArgNumber(item.op, operator.arity);
              if (number === -1) return nonexistent();
              walk.node = operands[number - 1];
            } else if (operator.kind === "OpDef" && operator.defKind === "BuiltIn") {
              if (operator.name === "$RcdConstructor" || operator.name === "$SetOfRcds") {
                if (operandNumber === -1) return nonexistent();
                const pair = operands[operandNumber - 1];
                if (!isPair(pair)) return notPair();
                walk.node = pair.operands[1];
              } else if (operator.name === "$Case") {
                if (walk.index === items.length - 1) {
                  return generator.addError(
                    getItemLocation(walk.index),
                    "Subexpression of CASE must have form !i!j.",
                  );
                }
                if (operandNumber === -1) return nonexistent();
                const pair = operands[operandNumber - 1];
                if (!isPair(pair)) return notPair();
                walk.index++;
                const number = getArgNumber(items[walk.index].op, 2);
                if (number === -1) {
                  return generator.addError(
                    getItemLocation(walk.index),
                    "Second selector for CASE subexpression must specify  one of two operands.",
                  );
                }
                walk.node = pair.operands[number - 1];
                if (walk.node === undefined)
                  return generator.addError(
                    getItemLocation(walk.index),
                    "Selecting OTHER in a CASE statement.",
                  );
              } else if (operator.name === "$Except") {
                if (operandNumber > 1) {
                  return generator.addError(
                    getItemLocation(walk.index),
                    "Selecting subexpression of an EXCEPT not yet implemented.",
                  );
                }
                if (operandNumber === -1) return nonexistent();
                walk.node = operands[operandNumber - 1];
              } else if ((node.bounded?.length ?? 0) === 0 && (node.unbounded?.length ?? 0) === 0) {
                if (operandNumber === -1) return nonexistent();
                walk.node = operands[operandNumber - 1];
              } else if (item.op === "Null" || item.op === "@") {
                const symbols = getQuantifierSymbols(node);
                params.push(...symbols);
                if (item.op === "Null") {
                  if (getArgs(item).length !== symbols.length) {
                    return generator.addError(
                      getItemLocation(walk.index),
                      `Selector with ${getArgs(item).length} argument(s) used for quantifier with ${symbols.length} bound identifier(s).`,
                    );
                  }
                  allArgs.push(...getArgs(item).map(generator.generateExpression));
                }
                walk.node = operands[0];
              } else {
                const number = getArgNumber(item.op, node.ranges.length);
                if (number === -1) return nonexistent();
                walk.node = node.ranges[number - 1];
              }
            } else {
              return generator.addError(
                getItemLocation(walk.index),
                `Choosing operand \`${item.name}' of subexpression with no operands.`,
              );
            }
          } else if (node.kind === "AssumeProve") {
            if (node.isSuffices && !walk.isInSuffices) {
              if (getArgNumber(item.op, 1) !== 1) {
                return generator.addError(
                  getItemLocation(walk.index),
                  "Accessing non-existent subexpression of a SUFFICES",
                );
              }
              walk.isInSuffices = true;
            } else {
              walk.isInSuffices = false;
              const number = getArgNumber(item.op, 1 + node.assumptions.length);
              if (number === -1) return nonexistent();
              if (generator.isOutOfClauseScope(node, number)) {
                return generator.addError(
                  getItemLocation(walk.index),
                  "Accessing ASSUME/PROVE clause within the scope of a declaration\n from outside that declaration's scope.",
                );
              }
              if (number <= node.assumptions.length) {
                walk.node = node.assumptions[number - 1];
                if (walk.node.kind === "NewSymb" && walk.index !== items.length - 1) {
                  return generator.addError(
                    getItemLocation(walk.index),
                    "Selected a subexpression of a NEW clause of an ASSUME.",
                  );
                }
              } else walk.node = node.goal;
            }
          } else if (node.kind === "OpArg") {
            const lambda = node.op;
            if (lambda.kind !== "OpDef" || lambda.name !== "LAMBDA") {
              return generator.addError(
                getItemLocation(walk.index),
                "Trying to select subexpression of an operator argument.",
              );
            }
            if (item.op !== "Null" && item.op !== "@") {
              return generator.addError(
                getItemLocation(walk.index),
                `Cannot use !${item.name} to select subexpression of a LAMBDA.`,
              );
            }
            if (item.op === "Null") {
              if (lambda.arity !== getArgs(item).length) {
                return generator.addError(
                  getItemLocation(walk.index),
                  `Selector with ${getArgs(item).length} arguments used for LAMBDA expression taking ${lambda.arity} arguments.`,
                );
              }
              allArgs.push(...getArgs(item).map(generator.generateExpression));
            }
            params.push(...(lambda.params ?? []));
            walk.node = lambda.body;
          } else if (node.kind === "Label") {
            walk.node = node.body;
            walk.index--;
          } else {
            return generator.addError(
              getItemLocation(walk.index),
              "Selecting subexpression of expression that has none.",
            );
          }
          if (walk.node === undefined)
            return generator.addError(
              getItemLocation(walk.index),
              `An unexpected null node specified by '${item.name}'.\nThis is probably due to a previous error.`,
            );
          if (walk.index !== items.length - 1) {
            const next = items[walk.index + 1];
            if (next.op === "Name") {
              while (walk.node?.kind === "Label") walk.node = walk.node.body;
              if (walk.node?.kind !== "LetIn") {
                return generator.addError(
                  getItemLocation(walk.index),
                  "A name selector here must be from a LET clause.",
                );
              }
              walk.letInContext = walk.node.context;
              walk.mode = "FindingOpName";
            } else if (next.op === ":") {
              return generator.addError(
                getItemLocation(walk.index),
                "!: should not follow an operand selector.",
              );
            }
          }
          walk.previousMode = "FindingSubExpr";
          break;
        }
      }
      walk.index++;
    }

    const node = walk.node;
    if (node === undefined)
      return generator.addError(
        location,
        "Subexpression selection failed, probably due to an error in the selected expression.",
      );
    if (node.kind === "AssumeProve" || node.kind === "NewSymb") {
      if (isFact) return node;
      return generator.addError(
        location,
        node.kind === "AssumeProve"
          ? "Selected ASSUME/PROVE instead of expression."
          : "Selected a NEW declaration as an expression or operator.",
      );
    }
    if (expectedArity < 0) {
      const isDefinition =
        (node.kind === "OpDef" &&
          (node.defKind === "UserDefined" ||
            node.defKind === "NumberedProofStep" ||
            (node.defKind === "ModuleInstance" && isDef))) ||
        node.kind === "ThmOrAssumpDef";
      if (walk.previousMode !== "FindingOpName" || !isDefinition) {
        return generator.addError(location, "DEF clause entry should describe a defined operator.");
      }
      if (node.kind === "OpDef" && node.step !== undefined && node.step.kind !== "DefStep") {
        return generator.addError(location, "DEF clause entry refers to a non-definition step.");
      }
      return node;
    }
    if (node.kind === "OpDef" && node.defKind === "NumberedProofStep") {
      return generator.addError(
        location,
        isFact
          ? "Step number of non-fact used as a fact"
          : "Step number of non-expression step used as an expression.",
      );
    }
    if (expectedArity > 0) {
      const found =
        params.length +
        (node.kind === "OpArg"
          ? getSymbolArity(node.op)
          : walk.previousMode === "FindingOpName" && isSymbol(node)
            ? getSymbolArity(node)
            : 0);
      if (expectedArity !== found) {
        return generator.addError(
          location,
          `Expected arity ${expectedArity} but found operator of arity ${found}.`,
        );
      }
    }
    let current: LevelNode | SymbolNode = node;
    if (walk.previousMode === "FindingOpName" && params.length + substInPrefix.length > 0) {
      if (current.kind !== "OpDef" && current.kind !== "ThmOrAssumpDef") {
        return generator.addError(
          items[items.length - 1].location ?? location,
          "Internal Error: Found unexpected node kind after FindingOpName",
        );
      }
      allArgs.push(...walk.definitionArgs);
      const operands = (current.params ?? []).map((param) => {
        const copy = generator.createFormalParam(param.name, param.arity, param.location);
        params.push(copy);
        return param.arity === 0
          ? generator.createOpAppl(copy, [], location)
          : generator.createOpArg(copy, location);
      });
      current = generator.createOpAppl(current, operands, location);
    }
    if (current.kind === "OpArg") {
      if (expectedArity === 0)
        return generator.addError(location, "Selected operator argument when expression expected.");
      if (params.length + substInPrefix.length > 0) {
        const op = current.op;
        params.push(
          ...Array.from({ length: getSymbolArity(op) }, (_, paramIndex) =>
            generator.createFormalParam(`NewParam${paramIndex}`, 0, undefined),
          ),
        );
        current = generator.createOpAppl(op, walk.definitionArgs, location);
      }
    }
    if (!isFact) {
      const isAssumeProve =
        (current.kind === "ThmOrAssumpDef" && current.body.kind === "AssumeProve") ||
        (current.kind === "Label" && current.isAssumeProve);
      if (isAssumeProve)
        return generator.addError(location, "ASSUME/PROVE used where an expression is required.");
      if (current.kind === "ThmOrAssumpDef" && current.body.kind === "OpAppl") {
        const step = PROOF_STEP_OPERATORS.get(current.body.operator.name);
        if (step !== undefined)
          return generator.addError(location, `${step} proof step selected instead of expression.`);
      }
    }
    if (
      current.kind === "FormalParam" ||
      current.kind === "OpDecl" ||
      current.kind === "ThmOrAssumpDef" ||
      (current.kind === "OpDef" &&
        (current.defKind === "UserDefined" || current.defKind === "BuiltIn"))
    ) {
      return expectedArity > 0
        ? generator.createOpArg(current, location)
        : generator.createOpAppl(current, walk.definitionArgs, location);
    }
    if (current.kind === "OpArg") return current;
    if (current.kind === "OpDef" || current.kind === "Module") {
      if ((isFact || isDef) && current.kind === "OpDef") return current;
      return generator.addError(location, "Module instantiation selected instead of expression.");
    }
    const expression = substInPrefix.reduceRight<ExprNode>(
      (body, prefix) => generator.copySubstIn(prefix, body),
      current,
    );
    const lambda =
      params.length > 0 ? generator.createLambda(params, expression, location) : undefined;
    if (expectedArity > 0) {
      if (lambda === undefined || params.length !== expectedArity) {
        return generator.addError(
          location,
          `Expected operator argument with arity ${expectedArity} but found one of arity ${params.length}.`,
        );
      }
      return generator.createOpArg(lambda, location);
    }
    if (params.length !== allArgs.length) {
      return generator.addError(
        location,
        `Expected ${params.length} arguments but found ${allArgs.length}.`,
      );
    }
    return lambda === undefined
      ? generator.createOpAppl(generator.getBuiltin("$Nop"), [expression], location)
      : generator.createOpAppl(lambda, allArgs, location);
  };
};
