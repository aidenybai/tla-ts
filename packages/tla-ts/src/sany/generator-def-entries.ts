import type { Expression } from "../ast";
import {
  getExpressionSpan,
  getMatchingIndex,
  getParenthesizedSpan,
  getSpanLocation,
  getTokenSource,
  isToken,
  type SourceFile,
  type TokenSpan,
} from "./source";
import type { SanyLocation } from "./nodes";

interface DefEntryParts {
  hasChildlessFirstChild: boolean | undefined;
  last: TokenSpan;
  lastKind: string | undefined;
}

export interface DefEntryError {
  location: SanyLocation;
  message: string;
}

const SYNTAX_KINDS = new Map<Expression["kind"], string>([
  ["Identifier", "N_GeneralId"],
  ["Subexpression", "N_GeneralId"],
  ["Number", "N_Number"],
  ["Decimal", "N_Real"],
  ["SetEnumeration", "N_SetEnumerate"],
  ["SetFilter", "N_SubsetOf"],
  ["SetMap", "N_SetOfAll"],
  ["Tuple", "N_Tuple"],
  ["Product", "N_Times"],
  ["FunctionApplication", "N_FcnAppl"],
  ["FunctionConstruction", "N_FcnConst"],
  ["FunctionSet", "N_SetOfFcns"],
  ["Record", "N_RcdConstructor"],
  ["RecordSet", "N_SetOfRcds"],
  ["FieldAccess", "N_RecordComponent"],
  ["Except", "N_Except"],
  ["Prime", "N_PostfixExpr"],
  ["Always", "N_PrefixExpr"],
  ["Eventually", "N_PrefixExpr"],
  ["Enabled", "N_PrefixExpr"],
  ["Unchanged", "N_PrefixExpr"],
  ["Forall", "N_BoundedQuant"],
  ["Exists", "N_BoundedQuant"],
  ["UnboundedQuantifier", "N_UnboundedQuant"],
  ["Choose", "N_UnBoundedOrBoundedChoose"],
  ["If", "N_IfThenElse"],
  ["Case", "N_Case"],
  ["Let", "N_LetIn"],
  ["BoxAction", "N_ActionExpr"],
  ["AngleAction", "N_ActionExpr"],
  ["WeakFairness", "N_FairnessExpr"],
  ["StrongFairness", "N_FairnessExpr"],
]);

const NESTED_FIRST_CHILD_KINDS = new Set([
  "N_GeneralId",
  "N_OpApplication",
  "N_PrefixExpr",
  "N_InfixExpr",
  "N_PostfixExpr",
  "N_FcnAppl",
  "N_RecordComponent",
]);

const isParenthesized = (file: SourceFile, span: TokenSpan) =>
  isToken(file, span.start, "(") && getMatchingIndex(file, span.start) === span.end;

export const getOperandSpan = (file: SourceFile, expression: Expression) =>
  getParenthesizedSpan(file, getExpressionSpan(file, expression));

const getApplicationKind = (
  file: SourceFile,
  expression: Expression & { kind: "Apply" },
  span: TokenSpan,
) => {
  if (getOperandSpan(file, expression.args[0]).start === span.start) {
    return expression.args.length === 2 ? "N_InfixExpr" : "N_PostfixExpr";
  }
  return file.tokens[span.start].kind === "Identifier" ? "N_OpApplication" : "N_PrefixExpr";
};

const getSyntaxKind = (file: SourceFile, expression: Expression, span: TokenSpan) => {
  if (isParenthesized(file, span)) return "N_ParenExpr";
  if (expression.kind === "String") return getTokenSource(file, span.start);
  if (expression.kind === "Apply") return getApplicationKind(file, expression, span);
  if (expression.kind === "And" || expression.kind === "Or") {
    if (!expression.isBulleted) return "N_InfixExpr";
    return expression.kind === "And" ? "N_ConjList" : "N_DisjList";
  }
  return SYNTAX_KINDS.get(expression.kind);
};

const hasChildlessFirstChild = (file: SourceFile, expression: Expression, span: TokenSpan) => {
  if (expression.kind === "String" && !isParenthesized(file, span)) return false;
  if (expression.kind === "Identifier" && !expression.name.includes("!")) return true;
  const kind = getSyntaxKind(file, expression, span);
  return kind === undefined || NESTED_FIRST_CHILD_KINDS.has(kind) ? undefined : true;
};

const getDefEntryParts = (
  file: SourceFile,
  expression: Expression,
  span: TokenSpan,
): DefEntryParts | undefined => {
  const getPart = (operand: Expression, partSpan = getOperandSpan(file, operand)) => ({
    last: partSpan,
    lastKind: getSyntaxKind(file, operand, partSpan),
  });
  const getSecondHeir = (end: number, lastKind: string) => ({
    hasChildlessFirstChild: false,
    last: { start: span.start + 1, end },
    lastKind,
  });
  const getOperator = (left: Expression, lastKind: string) => {
    const leftSpan = getOperandSpan(file, left);
    return {
      hasChildlessFirstChild: hasChildlessFirstChild(file, left, leftSpan),
      last: { start: leftSpan.end + 1, end: leftSpan.end + 1 },
      lastKind,
    };
  };
  if (isParenthesized(file, span)) {
    const inner = { start: span.start + 1, end: span.end - 1 };
    return { hasChildlessFirstChild: false, ...getPart(expression, inner) };
  }
  switch (expression.kind) {
    case "If":
    case "BoxAction":
    case "AngleAction":
      return {
        hasChildlessFirstChild: false,
        ...getPart(expression.kind === "If" ? expression.condition : expression.action),
      };
    case "Tuple":
    case "SetEnumeration": {
      const first = expression.elements[0];
      return first === undefined
        ? {
            hasChildlessFirstChild: false,
            last: { start: span.end, end: span.end },
            lastKind: file.tokens[span.end].text,
          }
        : { hasChildlessFirstChild: false, ...getPart(first) };
    }
    case "Except":
      return { hasChildlessFirstChild: false, ...getPart(expression.function) };
    case "FunctionSet":
      return { hasChildlessFirstChild: false, ...getPart(expression.domain) };
    case "SetMap":
      return { hasChildlessFirstChild: false, ...getPart(expression.expression) };
    case "WeakFairness":
    case "StrongFairness":
      return { hasChildlessFirstChild: false, ...getPart(expression.subscript) };
    case "Case":
      return getSecondHeir(getOperandSpan(file, expression.arms[0].body).end, "N_CaseArm");
    case "Record":
    case "RecordSet":
      return getSecondHeir(
        getOperandSpan(file, expression.fields[0].value).end,
        expression.kind === "Record" ? "N_FieldVal" : "N_FieldSet",
      );
    case "FunctionConstruction":
    case "Forall":
    case "Exists":
      return getSecondHeir(getOperandSpan(file, expression.bounds[0].set).end, "N_QuantBound");
    case "Let":
      return getSecondHeir(getOperandSpan(file, expression.body).start - 2, "N_LetDefinitions");
    case "Product":
      return getOperator(expression.factors[0], "N_GenInfixOp");
    case "And":
    case "Or": {
      if (expression.operands.length === 1) return undefined;
      // A chain of infix junctions nests its first operand, as N_InfixExpr does.
      if (!expression.isBulleted) {
        return expression.operands.length === 2
          ? getOperator(expression.operands[0], "N_GenInfixOp")
          : undefined;
      }
      const item = getOperandSpan(file, expression.operands[1]);
      return {
        hasChildlessFirstChild: true,
        last: { start: item.start - 1, end: item.end },
        lastKind: expression.kind === "And" ? "N_ConjItem" : "N_DisjItem",
      };
    }
    case "Always":
    case "Eventually":
    case "Enabled":
    case "Unchanged":
      return {
        hasChildlessFirstChild: true,
        ...getPart(expression.expression, { start: span.start + 1, end: span.end }),
      };
    case "Prime":
      return {
        hasChildlessFirstChild: hasChildlessFirstChild(
          file,
          expression.expression,
          getOperandSpan(file, expression.expression),
        ),
        last: { start: span.end, end: span.end },
        lastKind: "N_GenPostfixOp",
      };
    case "FunctionApplication":
    case "FieldAccess": {
      const operand =
        expression.kind === "FunctionApplication" ? expression.function : expression.record;
      const operandSpan = getOperandSpan(file, operand);
      const next = operandSpan.end + 1;
      return {
        hasChildlessFirstChild: hasChildlessFirstChild(file, operand, operandSpan),
        last: { start: next, end: next },
        lastKind: file.tokens[next].text,
      };
    }
    case "Apply": {
      const kind = getApplicationKind(file, expression, span);
      if (kind === "N_OpApplication") {
        return expression.operator.includes("!")
          ? undefined
          : {
              hasChildlessFirstChild: true,
              last: { start: span.start + 1, end: span.end },
              lastKind: "N_OpArgs",
            };
      }
      if (kind === "N_PrefixExpr") {
        return {
          hasChildlessFirstChild: true,
          ...getPart(expression.args[0], { start: span.start + 1, end: span.end }),
        };
      }
      return getOperator(
        expression.args[0],
        kind === "N_InfixExpr" ? "N_GenInfixOp" : "N_GenPostfixOp",
      );
    }
  }
  return undefined;
};

export const getDefEntryErrors = (file: SourceFile, expression: Expression): DefEntryError[] => {
  const span = getOperandSpan(file, expression);
  const location = getSpanLocation(file, span);
  const parts = getDefEntryParts(file, expression, span);
  const isOneHeir =
    expression.kind === "Number" ||
    expression.kind === "String" ||
    ((expression.kind === "And" || expression.kind === "Or") && expression.operands.length === 1);
  if (parts === undefined && isOneHeir) {
    // Deviation from SANY: Generator#genIdToSelector throws ArrayIndexOutOfBoundsException on a node with one heir, such as a number, a string, or a one-item junction list; tla-ts rejects it as an entry that describes no definition.
    return [{ location, message: "DEF clause entry should describe a defined operator." }];
  }
  if (parts?.hasChildlessFirstChild === undefined || parts.lastKind === undefined) return [];
  const lastLocation = getSpanLocation(file, parts.last);
  return [
    ...(parts.hasChildlessFirstChild ? [{ location, message: "Was expecting a GeneralId." }] : []),
    ...(parts.lastKind === "N_OpArgs"
      ? [{ location: lastLocation, message: "Selector `!(...)' should not have argument(s)." }]
      : [
          { location: lastLocation, message: "Unexpected token found." },
          {
            location: lastLocation,
            message: `Need name or step number here, not \`${parts.lastKind}'.`,
          },
        ]),
    { location, message: "DEF clause entry should describe a defined operator." },
  ];
};
