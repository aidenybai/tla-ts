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
import type { ModuleGeneration } from "./generation";

interface DefEntryParts {
  hasChildlessFirstChild: boolean | undefined;
  last: TokenSpan;
  lastKind: string | undefined;
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
      const left = getOperandSpan(file, expression.args[0]);
      const operator = left.end + 1;
      return {
        hasChildlessFirstChild: hasChildlessFirstChild(file, expression.args[0], left),
        last: { start: operator, end: operator },
        lastKind: kind === "N_InfixExpr" ? "N_GenInfixOp" : "N_GenPostfixOp",
      };
    }
  }
  return undefined;
};

export const reportDefEntry = (generation: ModuleGeneration, expression: Expression) => {
  const span = getOperandSpan(generation.file, expression);
  const isName =
    expression.kind === "Identifier" ||
    expression.kind === "Subexpression" ||
    expression.kind === "OperatorReference";
  if (isName && !isParenthesized(generation.file, span)) return false;
  const parts = getDefEntryParts(generation.file, expression, span);
  if (parts?.hasChildlessFirstChild === undefined || parts.lastKind === undefined) return false;
  const lastLocation = getSpanLocation(generation.file, parts.last);
  if (parts.hasChildlessFirstChild) {
    generation.addError(getSpanLocation(generation.file, span), "Was expecting a GeneralId.");
  }
  if (parts.lastKind === "N_OpArgs") {
    generation.addError(lastLocation, "Selector `!(...)' should not have argument(s).");
  } else {
    generation.addError(lastLocation, "Unexpected token found.");
    generation.addError(lastLocation, `Need name or step number here, not \`${parts.lastKind}'.`);
  }
  generation.addError(
    getSpanLocation(generation.file, span),
    "DEF clause entry should describe a defined operator.",
  );
  return true;
};
