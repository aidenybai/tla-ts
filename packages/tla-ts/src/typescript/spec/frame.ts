import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import { KEYWORDS } from "../../lexer";
import { parseModule } from "../../parser";
import { compareNames } from "../../obligations/module";
import { getSetBound } from "../../values";
import { formatString } from "../../printer";
import { type FunctionNode, getCommonJsExports, getFunction, isPlain, skipCasts } from "../context";
import { createNames } from "../names";
import { createProgram, type Library } from "../program";
import type { ProgramSystem } from "../system";

// A state variable of a model, which a trace shows by its binding's name.
export interface StateVariable {
  name: string;
}

interface Declared {
  name: string;
  declaration: ts.FunctionDeclaration | ts.VariableDeclaration;
  identifier: ts.Identifier;
}

interface Exported extends Declared {
  node: FunctionNode | ts.SignatureDeclaration;
  body: ts.ConciseBody;
  tags: Map<string, string>;
  // The signature of a const's type that the model calls, where the type has call signatures of
  // its own, as an overloaded or a dual function's does, and how the call reaches it.
  signature?: { value: ts.Signature; note: string };
}

interface Parameter {
  node: ts.ParameterDeclaration;
  name: string;
  symbol: ts.Symbol | undefined;
  // Its type, as the signature that the model calls instantiates it.
  type: ts.Type;
}

// Why a type has no finite set of values.
// A finite type's values as a TLA+ set, and how many it has.
interface Domain {
  text: string;
  size: number;
}

// A member of a union as the program writes it, with the node that writes it alone.
interface WrittenMember {
  type: ts.Type;
  node?: ts.TypeNode;
}

interface Infinite {
  message: string;
  // Whether TLC can't compare the values, which tla-ts could list.
  isIncomparable?: boolean;
}

// What TLC compares in a value of a finite type: a primitive's kind, or a set's elements, or a
// function's keys and values, as a tuple, an array, a record, or a map is a function. Undefined and
// null are model values, which TLC compares with any value.
interface Shape {
  kind: "model" | "boolean" | "number" | "bigint" | "string" | "set" | "function";
  keys?: Shape;
  values?: ReadonlyMap<string, Shape>;
  rest?: Shape;
}

const TEMPORAL_TAGS = new Map([
  ["eventually", (value: string) => `<>(${value})`],
  ["alwaysEventually", (value: string) => `[]<>(${value})`],
  ["eventuallyAlways", (value: string) => `<>[](${value})`],
]);

// The tags whose functions become named predicates, by the section of the config that lists them.
const PREDICATE_TAGS = new Map([
  ["constraint", "CONSTRAINTS"],
  ["actionConstraint", "ACTION_CONSTRAINTS"],
  ["view", "VIEW"],
  ["postcondition", "POSTCONDITIONS"],
  ["assume", "ASSUME"],
]);

// The tags that make an exported function a property of the spec rather than an action.
const VALUE_TAGS = new Set([
  ...TEMPORAL_TAGS.keys(),
  ...PREDICATE_TAGS.keys(),
  "initially",
  "always",
  "leadsTo",
  "terminating",
]);

const KNOWN_TAGS = new Set([...VALUE_TAGS, "fair", "strongFair", "symmetric", "noDeadlock"]);

// The methods that change the array, set, or map they're called on.
const MUTATING_METHODS = new Set([
  "push",
  "unshift",
  "pop",
  "shift",
  "add",
  "delete",
  "clear",
  "set",
  "getOrInsert",
  "getOrInsertComputed",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
  "splice",
]);

const MAX_ARRAY_LENGTH = 3;

// The most characters of a type that a note prints, as TypeScript's typeToString prints at most
// where the program's options don't ask for whole errors.
const MOST_TYPE_CHARACTERS = 320;

// The types that TypeScript makes before it reads a program, with the keywords that write them, in
// the order of their ids, which no run changes: a union's members of these types come first, as
// typeToString prints them and as a frame lists them.
const INTRINSICS = [
  { keyword: ts.SyntaxKind.AnyKeyword, flag: ts.TypeFlags.Any },
  { keyword: ts.SyntaxKind.UnknownKeyword, flag: ts.TypeFlags.Unknown },
  { keyword: ts.SyntaxKind.StringKeyword, flag: ts.TypeFlags.String },
  { keyword: ts.SyntaxKind.NumberKeyword, flag: ts.TypeFlags.Number },
  { keyword: ts.SyntaxKind.BigIntKeyword, flag: ts.TypeFlags.BigInt },
  { keyword: ts.SyntaxKind.BooleanKeyword, flag: ts.TypeFlags.Boolean },
  { keyword: ts.SyntaxKind.SymbolKeyword, flag: ts.TypeFlags.ESSymbol },
  { keyword: ts.SyntaxKind.VoidKeyword, flag: ts.TypeFlags.Void },
  { keyword: ts.SyntaxKind.NeverKeyword, flag: ts.TypeFlags.Never },
  { keyword: ts.SyntaxKind.ObjectKeyword, flag: ts.TypeFlags.NonPrimitive },
];

// The values that a frame lists first of a union's literals, in this order, before its numbers in
// order of value and its strings in order of their text.
const FIRST_LITERALS = ["Undefined", "Null", "FALSE", "TRUE"];

// The kinds of a parameter's type that a note names where no domain lists it, in the order that it
// names the first of a union's.
const UNLISTED_KINDS = [
  "any, as an untyped parameter is",
  "unknown",
  "a function",
  "an instance of a class",
  "an object with methods",
];

// The kinds of values that a note names where a union mixes them, in the order that it names them.
const VALUE_KINDS = ["string", "number", "bigint", "boolean", "array", "Set", "Map", "object"];

// The values that an export's domains take in place of its types that have no finite set of
// values, each rung smaller than the one before: what every type parameter without a constraint
// takes, and the longest array, which bounds an iterable and a tuple with a rest element too.
interface Rung {
  values: readonly number[];
  length: number;
}

const RUNGS: readonly Rung[] = [
  { values: [0, 1, 2], length: MAX_ARRAY_LENGTH },
  { values: [0, 1], length: 2 },
  { values: [0], length: 1 },
];

// The most argument lists that the model calls an export with on a rung, which the export takes
// the first rung that fits. Each is a call on JS.tla: a check of Effect's Array.ts, whose 95
// generic exports this bound gives 48,846 argument lists, took 961 s, about 50 calls a second, so
// a file's checks of its generic exports end well within the hour that a check is given.
const INSTANTIATED_LISTS = 10_000;

// The most characters of TLA+ that a parameter's set of values takes, which the model writes into
// its spec beside each check of the parameter.
const MOST_DOMAIN_CHARACTERS = 1_000_000;

// The names that the model's own definitions and variables take, which no TypeScript name may.
// A bound whose set a guard in the module's function gives, which a step reads in its state.
const GUARDED = "GuardedSet";

const MODEL_NAMES = new Set(["heap", "model", GUARDED]);

// Whether one typo, as an insertion, a deletion, a substitution, or a swap of two adjacent
// characters, turns one name into the other.
const isOneTypoApart = (name: string, other: string) => {
  const [shorter, longer] = name.length <= other.length ? [name, other] : [other, name];
  const start = [...shorter].findIndex((character, index) => character !== longer[index]);
  if (start === -1) return longer.length - shorter.length === 1;
  if (longer.length - shorter.length === 1) return shorter.slice(start) === longer.slice(start + 1);
  return (
    longer.length === shorter.length &&
    (shorter.slice(start + 1) === longer.slice(start + 1) ||
      (shorter[start] === longer[start + 1] &&
        shorter[start + 1] === longer[start] &&
        shorter.slice(start + 2) === longer.slice(start + 2)))
  );
};

// A tag that tla-ts doesn't know is documentation, such as @since or TSDoc's @typeParam, unless
// it's a typo of one that it knows.
const getTags = (node: ts.Node) =>
  new Map(
    ts.getJSDocTags(node).flatMap((tag): [string, string][] => {
      const name = tag.tagName.text;
      if (!KNOWN_TAGS.has(name)) {
        if ([...KNOWN_TAGS].some((known) => isOneTypoApart(name, known))) {
          throw new TlaTypeScriptError(`Unknown tag: @${name}`, tag);
        }
        return [];
      }
      return [[name, ts.getTextOfJSDocComment(tag.comment)?.trim() ?? ""]];
    }),
  );

const getBoundNames = (name: ts.BindingName): ts.Identifier[] =>
  ts.isIdentifier(name)
    ? [name]
    : name.elements.flatMap((element) =>
        ts.isOmittedExpression(element) ? [] : getBoundNames(element.name),
      );

const getRoot = (node: ts.Expression): ts.Expression =>
  ts.isPropertyAccessExpression(node) ||
  ts.isElementAccessExpression(node) ||
  ts.isParenthesizedExpression(node) ||
  ts.isNonNullExpression(node)
    ? getRoot(node.expression)
    : node;

// What an assignment, an increment, or a method that changes its receiver in place writes.
const getWritten = (node: ts.Node) => {
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
  ) {
    return node.left;
  }
  if (
    (ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) &&
    (node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken)
  ) {
    return node.operand;
  }
  // A method that changes an array literal changes only the array that the literal makes.
  return ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    MUTATING_METHODS.has(node.expression.name.text) &&
    !ts.isArrayLiteralExpression(skipCasts(node.expression.expression))
    ? node.expression.expression
    : undefined;
};

// The variables or other root expressions that an assignment target writes, as a destructuring
// target writes each of its elements.
const getWrittenRoots = (target: ts.Expression): ts.Expression[] => {
  if (ts.isArrayLiteralExpression(target)) return target.elements.flatMap(getWrittenRoots);
  if (ts.isObjectLiteralExpression(target)) {
    return target.properties.flatMap((property) =>
      ts.isPropertyAssignment(property)
        ? getWrittenRoots(property.initializer)
        : ts.isShorthandPropertyAssignment(property)
          ? [property.name]
          : ts.isSpreadAssignment(property)
            ? getWrittenRoots(property.expression)
            : [],
    );
  }
  if (ts.isSpreadElement(target)) return getWrittenRoots(target.expression);
  return [getRoot(target)];
};

const isBareReturn = (statement: ts.Statement): boolean =>
  ts.isReturnStatement(statement)
    ? statement.expression === undefined
    : ts.isBlock(statement) &&
      statement.statements.length === 1 &&
      isBareReturn(statement.statements[0]);

// Whether every call of a function throws, or never returns: a function that isn't async or a
// generator, whose body returns nowhere and ends in a throw.
const isAlwaysThrowing = (node: FunctionNode) => {
  const body = node.body;
  const isReturning = (inner: ts.Node): boolean =>
    ts.isReturnStatement(inner) ||
    (!ts.isFunctionLike(inner) && (ts.forEachChild(inner, isReturning) ?? false));
  return (
    body !== undefined &&
    ts.isBlock(body) &&
    isPlain(node) &&
    body.statements.length > 0 &&
    ts.isThrowStatement(body.statements[body.statements.length - 1]) &&
    !isReturning(body)
  );
};

// A value that evaluating can't throw or change.
const isInertValue = (argument: ts.Expression): boolean =>
  ts.isLiteralExpression(argument) ||
  ts.isIdentifier(argument) ||
  ts.isFunctionExpression(argument) ||
  ts.isArrowFunction(argument) ||
  [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
    argument.kind,
  ) ||
  (ts.isPrefixUnaryExpression(argument) &&
    argument.operator === ts.SyntaxKind.MinusToken &&
    (ts.isNumericLiteral(argument.operand) || ts.isBigIntLiteral(argument.operand))) ||
  (ts.isArrayLiteralExpression(argument) && argument.elements.every(isInertValue)) ||
  (ts.isObjectLiteralExpression(argument) &&
    argument.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        !ts.isComputedPropertyName(property.name) &&
        isInertValue(property.initializer),
    ));

// A junction of items, as a bulleted list of each on its own line, or one item alone.
const junction = (bullet: string, items: readonly string[]) =>
  items.length === 1 ? items[0] : items.map((item) => `\n  ${bullet} ${item}`).join("");

const isNumericKey = (key: string) => /^-?\d+$/.test(key);

const isFieldName = (key: string) => /^\w*[A-Za-z]\w*$/.test(key) && !KEYWORDS.has(key);

const isInfinite = (domain: string | Infinite): domain is Infinite => typeof domain !== "string";

const isUnlisted = (domain: Domain | Infinite): domain is Infinite => "message" in domain;

// The checker gives type arguments only of type references, which the public API can't detect.
const isTypeReference = (type: ts.Type): type is ts.TypeReference =>
  (type.flags & ts.TypeFlags.Object) !== 0 &&
  ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0;

const getTypeName = (type: ts.Type) => type.getSymbol()?.getName() ?? "";

// The collection's type of a class that extends one and adds only static members, whose instances
// are the collection's, or the type itself.
const getCollectionType = (type: ts.Type) => {
  const declaration = type.getSymbol()?.valueDeclaration;
  const base =
    declaration !== undefined &&
    ts.isClassLike(declaration) &&
    declaration.members.every(
      (member) =>
        ts.canHaveModifiers(member) &&
        (ts.getModifiers(member) ?? []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
        ),
    )
      ? type.getBaseTypes()?.at(0)
      : undefined;
  return base !== undefined && ["Set", "Map"].includes(getTypeName(base)) ? base : type;
};

const isSetType = (type: ts.Type) =>
  ["Set", "ReadonlySet"].includes(getTypeName(getCollectionType(type)));

const isMapType = (type: ts.Type) =>
  ["Map", "ReadonlyMap"].includes(getTypeName(getCollectionType(type)));

// The frame of a model that tla-ts checks on JS.tla, which TypeScript's types give: the state
// variables, the set of values that each state variable without an initializer starts at and
// each parameter of an exported function takes, which function is an action, an invariant, or a
// property its tag names, and the config that checks them. It's a spec whose definitions name
// the module's functions, which compileModelToJsTla calls on JS.tla. A program with type errors
// still has a frame, as Node still runs it. Its names avoid reserved, the names of the runtime that
// the spec extends.
export const frameModel = (
  source: string,
  fileName: string,
  library?: Library,
  reserved: ReadonlySet<string> = new Set(),
  // The most values that TLC puts in a set, as its -maxSetSize sets it.
  setBound = getSetBound(),
  // The names that the model binds below its spec's top level, which no export's definition takes.
  localNames: ReadonlySet<string> = new Set(),
  system?: ProgramSystem,
) => {
  const program = createProgram(source, fileName.replaceAll("\\", "/"), library, system);
  const sourceFile = program.sourceFile;
  const checker = program.checker;
  // The names of the exported functions and their parameters, which the model's code defines and
  // binds beside its own, and of the state variables, which only name the fields of its records.
  const names = createNames(new Set([...MODEL_NAMES, ...reserved]));
  const fieldNames = createNames(new Set());
  const getSymbol = (node: ts.Node) =>
    ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
  // The declaration of a function or a constant at the module's top level, which a call or a read
  // of the symbol runs.
  const getTopLevelDeclaration = (symbol: ts.Symbol | undefined) => {
    const declaration =
      symbol?.declarations?.find(
        (candidate) => ts.isFunctionDeclaration(candidate) && candidate.body !== undefined,
      ) ?? symbol?.valueDeclaration;
    if (declaration === undefined || declaration.getSourceFile() !== sourceFile) return undefined;
    if (ts.isFunctionDeclaration(declaration) && ts.isSourceFile(declaration.parent)) {
      return declaration;
    }
    return ts.isVariableDeclaration(declaration) &&
      ts.isVariableStatement(declaration.parent.parent) &&
      ts.isSourceFile(declaration.parent.parent.parent) &&
      (declaration.parent.flags & ts.NodeFlags.Const) !== 0
      ? declaration
      : undefined;
  };
  const tags = new Map<ts.Node, Map<string, string>>(
    sourceFile.statements.map((statement) => [statement, getTags(statement)]),
  );
  const symmetric = getSymmetricSets(sourceFile, tags, checker);
  // The functions and the variables that the module's statements declare.
  const declarations = sourceFile.statements.flatMap((statement): Declared[] => {
    if (ts.isFunctionDeclaration(statement) && statement.body !== undefined) {
      if (statement.name === undefined) {
        throw new TlaTypeScriptError("Name this function", statement);
      }
      return [{ name: statement.name.text, declaration: statement, identifier: statement.name }];
    }
    if (
      !ts.isVariableStatement(statement) ||
      (ts.getCombinedModifierFlags(statement.declarationList.declarations[0]) &
        ts.ModifierFlags.Ambient) !==
        0
    ) {
      return [];
    }
    return statement.declarationList.declarations.flatMap((declaration) =>
      getBoundNames(declaration.name).map((identifier) => ({
        name: identifier.text,
        declaration,
        identifier,
      })),
    );
  });
  // A const whose object a write changes in place holds a new value after it, as a let does, where
  // a literal or a new collection makes the object.
  const isLiteralObject = (symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    const initializer =
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer !== undefined
        ? skipCasts(declaration.initializer)
        : undefined;
    const constructed =
      initializer !== undefined && ts.isNewExpression(initializer)
        ? getSymbol(initializer.expression)
        : undefined;
    return (
      initializer !== undefined &&
      (ts.isObjectLiteralExpression(initializer) ||
        ts.isArrayLiteralExpression(initializer) ||
        (constructed !== undefined &&
          ["Map", "Set", "Array"].includes(constructed.name) &&
          (constructed.declarations ?? []).every(
            (inner) => inner.getSourceFile().isDeclarationFile,
          )))
    );
  };
  // The objects that a function's write changes in place, which a step may run. A write that the
  // module's top level makes runs once, as the module loads.
  const changed = new Set<ts.Symbol>();
  const findChanged = (node: ts.Node): void => {
    const written = getWritten(node);
    if (written !== undefined && ts.findAncestor(node, ts.isFunctionLike) !== undefined) {
      getWrittenRoots(written).forEach((root) => {
        const symbol = ts.isIdentifier(root) ? getSymbol(root) : undefined;
        if (symbol !== undefined && isLiteralObject(symbol)) changed.add(symbol);
      });
    }
    ts.forEachChild(node, findChanged);
  };
  findChanged(sourceFile);
  // A let is a state variable, and so is a const whose value a write changes in place. A variable
  // that holds a function or a class is the module's code, not its state.
  const isLet = (declared: Declared) => {
    const declaration = declared.declaration;
    const symbol = getSymbol(declared.identifier);
    const initializer =
      ts.isVariableDeclaration(declaration) && declaration.initializer !== undefined
        ? skipCasts(declaration.initializer)
        : undefined;
    return (
      ts.isVariableDeclaration(declaration) &&
      ((declaration.parent.flags & ts.NodeFlags.Const) === 0 ||
        !ts.isIdentifier(declaration.name) ||
        (symbol !== undefined && changed.has(symbol))) &&
      !(
        initializer !== undefined &&
        (ts.isArrowFunction(initializer) ||
          ts.isFunctionExpression(initializer) ||
          ts.isClassExpression(initializer))
      )
    );
  };
  // The bindings of the module by the names that TLA+ gives them, where those differ.
  const bindings = new Map<string, string>();
  // JS.tla reads a state variable and calls an exported function by its binding's name, which
  // TLA+ must take too, but for a state variable whose name TLA+ can't spell, as $ or _ are, which
  // takes a name that no binding of the module has.
  const getName = (declared: Declared, kind: string) => {
    if (
      kind === "state variable" &&
      /^[\w$]+$/.test(declared.name) &&
      !/^\w*[A-Za-z]\w*$/.test(declared.name)
    ) {
      const taken = new Set(declarations.map((other) => other.name));
      const getRenamed = (): string => {
        const candidate = names.getFresh(declared.name);
        return taken.has(candidate) ? getRenamed() : candidate;
      };
      const renamed = getRenamed();
      bindings.set(renamed, declared.name);
      return renamed;
    }
    const name = (kind === "state variable" ? fieldNames : names).getFresh(declared.name);
    if (name !== declared.name) {
      throw new TlaTypeScriptError(
        `tla-ts can't name the ${kind} ${declared.name} in TLA+, which takes the name for its own`,
        declared.identifier,
      );
    }
    return name;
  };
  const variables = declarations.filter(isLet).map((declared) => {
    const symbol = getSymbol(declared.identifier);
    if (symbol === undefined) {
      throw new TlaTypeScriptError(
        `tla-ts can't name the state variable ${declared.name}`,
        declared.declaration,
      );
    }
    return { name: getName(declared, "state variable"), symbol, declared };
  });
  const stateSymbols = new Set(variables.map((variable) => variable.symbol));
  // Whether a function assigns a state variable, directly or through a function it calls.
  const writesState = (node: ts.Node, visited: Set<ts.Node>): boolean => {
    const written = getWritten(node);
    if (
      written !== undefined &&
      getWrittenRoots(written).some((root) => {
        const symbol = ts.isIdentifier(root) ? getSymbol(root) : undefined;
        return symbol !== undefined && stateSymbols.has(symbol);
      })
    ) {
      return true;
    }
    if (ts.isCallExpression(node)) {
      const helper = getTopLevelDeclaration(getSymbol(node.expression));
      if (helper !== undefined && !visited.has(helper)) {
        visited.add(helper);
        if (writesState(helper, visited)) return true;
      }
    }
    return ts.forEachChild(node, (child) => writesState(child, visited) || undefined) ?? false;
  };
  // Whether a function reads a state variable, directly or through a declaration it reads.
  const readsState = (node: ts.Node, visited: Set<ts.Node>): boolean => {
    if (ts.isIdentifier(node)) {
      const symbol = getSymbol(node);
      if (symbol !== undefined && stateSymbols.has(symbol)) return true;
      const declaration = getTopLevelDeclaration(symbol);
      if (declaration !== undefined && !visited.has(declaration)) {
        visited.add(declaration);
        if (readsState(declaration, visited)) return true;
      }
    }
    return ts.forEachChild(node, (child) => readsState(child, visited) || undefined) ?? false;
  };
  const helpers = declarations.filter((declared) => !isLet(declared));
  // The local bindings that the module's export lists export, as export { local as name } does,
  // and those that a CommonJS file's exports name, as exports.name = local does.
  const commonJsLocals = new Set(getCommonJsExports(sourceFile).values());
  const listed = new Set([
    ...declarations.flatMap((declared) => {
      const symbol = getSymbol(declared.identifier);
      return commonJsLocals.has(declared.name) && symbol !== undefined ? [symbol] : [];
    }),
    ...sourceFile.statements.flatMap((statement) =>
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
        ? statement.exportClause.elements.flatMap((element) => {
            const local = element.isTypeOnly
              ? undefined
              : checker.getExportSpecifierLocalTargetSymbol(element);
            return local === undefined ? [] : [local];
          })
        : [],
    ),
  ]);
  // The signature that a call of a const reaches, where the const's type has call signatures, as an
  // overloaded function's type literal, or a named function type such as Order<A>, has: for a dual
  // function, the data-first signature, which dual dispatches to by its arity or by its predicate,
  // and otherwise the signature that takes the most parameters. Overloads are TypeScript's alone,
  // so each call runs the one function the initializer gives, as Node runs it.
  const getCalledSignature = (type: ts.TypeNode, initializer: ts.Expression) => {
    const signatures = checker.getTypeFromTypeNode(type).getCallSignatures();
    if (signatures.length === 0) return undefined;
    const call = skipCasts(initializer);
    const isDual =
      ts.isCallExpression(call) &&
      /(^|\.)dual$/.test(call.expression.getText()) &&
      call.arguments.length === 2;
    const arity =
      isDual && ts.isNumericLiteral(call.arguments[0]) ? Number(call.arguments[0].text) : undefined;
    const widest = signatures.reduce((found, signature) =>
      signature.getParameters().length > found.getParameters().length ? signature : found,
    );
    const value =
      arity === undefined
        ? widest
        : signatures.find((signature) => signature.getParameters().length === arity);
    if (value === undefined) return undefined;
    const shown = checker.signatureToString(value);
    const note = !isDual
      ? signatures.length === 1
        ? `its type's signature ${shown}`
        : `its signature ${shown}, of ${signatures.length}, which takes the most parameters`
      : arity !== undefined
        ? `its data-first signature ${shown}, which dual dispatches to by its arity, ${arity}`
        : `its signature ${shown}, which takes the most parameters, and which dual dispatches to by its predicate`;
    return { value, note };
  };
  const exported = helpers.flatMap((declared): Exported[] => {
    const declaration = declared.declaration;
    const node = getFunction(declaration);
    const symbol = getSymbol(declared.identifier);
    const statement = ts.isVariableDeclaration(declaration)
      ? declaration.parent.parent
      : declaration;
    const isExported =
      (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Export) !== 0 ||
      (symbol !== undefined && listed.has(symbol));
    if (!isExported) return [];
    if (node?.body !== undefined) {
      return [{ ...declared, node, body: node.body, tags: tags.get(statement) ?? new Map() }];
    }
    // A const whose type names a function, which its initializer gives from elsewhere, as another
    // module's function does, runs as a call of what the initializer gives.
    const initializer = ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;
    const type = ts.isVariableDeclaration(declaration) ? declaration.type : undefined;
    if (initializer === undefined || type === undefined) return [];
    if (ts.isFunctionTypeNode(type)) {
      return [
        { ...declared, node: type, body: initializer, tags: tags.get(statement) ?? new Map() },
      ];
    }
    const signature = getCalledSignature(type, initializer);
    const called = signature?.value.getDeclaration();
    return signature !== undefined && called !== undefined
      ? [
          {
            ...declared,
            node: called,
            body: initializer,
            tags: tags.get(statement) ?? new Map(),
            signature,
          },
        ]
      : [];
  });
  // An exported function whose name TLA+ takes for its own gets a name of its own, which a step
  // calls the function's binding by.
  const getExportName = (base: string): string => {
    const name = names.getFresh(base);
    return localNames.has(name) ? getExportName(base) : name;
  };
  exported.forEach((definition) => {
    const name = getExportName(definition.name);
    if (name !== definition.name) bindings.set(name, definition.name);
    definition.name = name;
  });
  const getTag = (definition: Exported) =>
    [...definition.tags.keys()].find((candidate) => VALUE_TAGS.has(candidate));

  // The first type that has no end, or the domains of every type, which the nodes may write. A
  // method is an object's property, whose callback's table the note names as a method's.
  const findDomains = (
    types: readonly ts.Type[],
    path: readonly ts.Type[],
    nodes: readonly (ts.TypeNode | undefined)[],
    isHeldOptional: (position: number) => boolean = () => false,
    isMethod = false,
  ) =>
    types.reduce<Domain[] | Infinite>((domains, type, position) => {
      if (!Array.isArray(domains)) return domains;
      const domain = findSizedDomain(
        type,
        path,
        nodes[position],
        isHeldOptional(position),
        isMethod,
      );
      return isUnlisted(domain) ? domain : [...domains, domain];
    }, []);
  const getLiteral = (type: ts.Type): string | undefined => {
    if (type.isStringLiteral()) return formatString(type.value);
    if (type.isNumberLiteral())
      return Number.isInteger(type.value) ? String(type.value) : undefined;
    if (type.flags & ts.TypeFlags.BooleanLiteral) {
      return checker.typeToString(type) === "true" ? "TRUE" : "FALSE";
    }
    if (type.flags & ts.TypeFlags.Null) return "Null";
    if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return "Undefined";
    return undefined;
  };
  const getLiteralRank = (type: ts.Type) => {
    const rank = FIRST_LITERALS.indexOf(getLiteral(type) ?? "");
    if (rank !== -1) return rank;
    return type.isNumberLiteral() ? FIRST_LITERALS.length : FIRST_LITERALS.length + 1;
  };
  // A type parameter's constraint, or undefined where it has none but unknown.
  const getConstraint = (type: ts.Type) => {
    const constraint = checker.getBaseConstraintOfType(type);
    return constraint === undefined || constraint.flags & ts.TypeFlags.Unknown
      ? undefined
      : constraint;
  };
  // The one call signature of a function type that has no properties, which a table stands for.
  const getCallback = (type: ts.Type) => {
    const signatures = type.getCallSignatures();
    return signatures.length === 1 &&
      type.getConstructSignatures().length === 0 &&
      type.getProperties().length === 0
      ? signatures[0]
      : undefined;
  };
  // A type that holds itself, as a constructed value's type may, is a record's shape.
  const getShape = (type: ts.Type, outer: readonly ts.Type[] = []): Shape | undefined => {
    if (outer.includes(type))
      return { kind: "function", keys: { kind: "string" }, values: new Map() };
    const getInner = (inner: ts.Type) => getShape(inner, [...outer, type]);
    if (type.flags & ts.TypeFlags.TypeParameter) {
      const constraint = getConstraint(type);
      return constraint === undefined ? { kind: "number" } : getInner(constraint);
    }
    // A callback is the record of its table, as its domain makes it.
    if (getCallback(type) !== undefined) {
      return { kind: "function", keys: { kind: "string" }, values: new Map() };
    }
    if (type.isUnion()) {
      return type.types
        .map(getInner)
        .reduce((left, right) => left && right && unifyShapes(left, right));
    }
    if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Null)) {
      return { kind: "model" };
    }
    if (type.flags & ts.TypeFlags.BooleanLike) return { kind: "boolean" };
    if (type.flags & ts.TypeFlags.NumberLike) return { kind: "number" };
    if (type.flags & ts.TypeFlags.BigIntLike) return { kind: "bigint" };
    if (type.flags & ts.TypeFlags.StringLike) return { kind: "string" };
    const typeArguments = isTypeReference(type) ? checker.getTypeArguments(type) : [];
    if (isSetType(type)) {
      const rest = getInner(typeArguments[0]);
      return rest && { kind: "set", rest };
    }
    if (isMapType(type)) {
      const [keys, rest] = typeArguments.map(getInner);
      return keys && rest && { kind: "function", keys, rest };
    }
    if (checker.isArrayType(type) || getTypeName(type) === "Iterable") {
      const rest = getInner(typeArguments[0]);
      return rest && { kind: "function", keys: { kind: "number" }, rest };
    }
    const properties = checker.isTupleType(type)
      ? typeArguments.map((inner, position) => ({ key: String(position), type: inner }))
      : type.getProperties().map((property) => ({
          key: property.name,
          type: checker.getTypeOfSymbol(property),
        }));
    const shapes = properties.map((property) => getInner(property.type));
    if (shapes.some((shape) => shape === undefined)) return undefined;
    return {
      kind: "function",
      keys: {
        kind:
          checker.isTupleType(type) || properties.every((property) => isNumericKey(property.key))
            ? "number"
            : "string",
      },
      values: new Map(
        properties.flatMap((property, position) => {
          const shape = shapes[position];
          return shape === undefined ? [] : [[property.key, shape] as const];
        }),
      ),
    };
  };
  // The shape of the values of two shapes, or undefined where TLC would compare values of
  // different kinds, such as a string with a number, which it can't.
  const unifyShapes = (left: Shape, right: Shape): Shape | undefined => {
    if (left.kind === "model") return right;
    if (right.kind === "model") return left;
    if (left.kind !== right.kind) return undefined;
    if (left.kind !== "set" && left.kind !== "function") return left;
    const unifyPart = (leftPart: Shape | undefined, rightPart: Shape | undefined) =>
      leftPart === undefined || rightPart === undefined
        ? { shape: leftPart ?? rightPart }
        : { shape: unifyShapes(leftPart, rightPart), isConflict: true };
    const keys = unifyPart(left.keys, right.keys);
    const rest = unifyPart(left.rest, right.rest);
    const fields = [...new Set([...(left.values?.keys() ?? []), ...(right.values?.keys() ?? [])])];
    const values = fields.map((field) => ({
      field,
      ...unifyPart(left.values?.get(field) ?? left.rest, right.values?.get(field) ?? right.rest),
    }));
    return [keys, rest, ...values].some(
      (part) => part.isConflict === true && part.shape === undefined,
    )
      ? undefined
      : {
          kind: left.kind,
          keys: keys.shape,
          rest: rest.shape,
          values: new Map(
            values.flatMap((value) =>
              value.shape === undefined ? [] : [[value.field, value.shape] as const],
            ),
          ),
        };
  };
  // A type's text, as typeToString prints it, with each union's keywords first, as their types'
  // ids order them, then its other members in order of their text, and null and undefined last.
  // typeToString orders a union's members by their types' ids, which a checker that frames several
  // files numbers in the order that the frames read them.
  const printer = ts.createPrinter({ removeComments: true });
  const printNode = (node: ts.Node) =>
    // HACK: printNode's declaration asks for a source file, but typeToString prints with none, so
    // that a node the checker reuses from a declaration prints from its own file's text.
    printer.printNode(ts.EmitHint.Unspecified, node, undefined as unknown as ts.SourceFile);
  const getMemberRank = (node: ts.TypeNode) => {
    const rank = INTRINSICS.findIndex((intrinsic) => intrinsic.keyword === node.kind);
    if (rank !== -1) return rank;
    return ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword
      ? INTRINSICS.length + 1
      : node.kind === ts.SyntaxKind.UndefinedKeyword
        ? INTRINSICS.length + 2
        : INTRINSICS.length;
  };
  const sortUnions = (context: ts.TransformationContext) => (root: ts.TypeNode) => {
    const visit = (node: ts.Node): ts.Node => {
      const visited = ts.visitEachChild(node, visit, context);
      if (!ts.isUnionTypeNode(visited)) return visited;
      const members = visited.types
        .map((member) => ({ member, rank: getMemberRank(member), text: printNode(member) }))
        .toSorted((left, right) => left.rank - right.rank || compareNames(left.text, right.text));
      return context.factory.updateUnionTypeNode(
        visited,
        context.factory.createNodeArray(members.map((inner) => inner.member)),
      );
    };
    return ts.visitNode(root, visit, ts.isTypeNode);
  };
  const printType = (type: ts.Type) => {
    const node = checker.typeToTypeNode(
      type,
      undefined,
      ts.NodeBuilderFlags.AllowUniqueESSymbolType |
        ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope |
        ts.NodeBuilderFlags.IgnoreErrors |
        ts.NodeBuilderFlags.NoTruncation,
    );
    if (node === undefined) return checker.typeToString(type);
    const text = printNode(ts.transform(node, [sortUnions]).transformed[0]);
    return program.options.noErrorTruncation === true || text.length < MOST_TYPE_CHARACTERS
      ? text
      : `${text.slice(0, MOST_TYPE_CHARACTERS - 3)}...`;
  };
  const getInfinite = (type: ts.Type, reason: string): Infinite => ({
    message: `${printType(type)} isn't finite: ${reason}`,
  });
  // The rung that the export whose domains are being listed takes, the first but while the
  // model tries a rung for an export and translates its call.
  let rung = RUNGS[0];
  // The arrays of an element's values from a length up to the rung's.
  const getArrayDomain = (element: Domain, shortest: number): Domain => {
    const length = names.getFresh("length");
    return {
      text: `UNION {[1..${length} -> (${element.text})] : ${length} \\in ${shortest}..${rung.length}}`,
      size: Array.from(
        { length: rung.length + 1 - shortest },
        (_, count) => element.size ** (shortest + count),
      ).reduce((sum, count) => sum + count, 0),
    };
  };
  // What the domains of the last export's parameters took in place of a type that has no finite
  // set of values, which the note of its call states: a type parameter's values, an iterable as an
  // array, and a callback as a table.
  const assumed = new Set<string>();
  // A held optional field's type, where the program's options make optional fields exact, holds the
  // missing type, which TypeScript adds to it beside any undefined that it declares, and which no
  // value of the field is, as removeMissingType tells.
  const isMissing = (type: ts.Type) =>
    program.options.exactOptionalPropertyTypes === true &&
    (type.flags & ts.TypeFlags.Undefined) !== 0 &&
    type !== checker.getUndefinedType();
  // The symbol that a name refers to, through imports.
  const getReferenced = (name: ts.EntityName) => {
    const symbol = checker.getSymbolAtLocation(name);
    return symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  };
  // A type node as the program writes its type, through parentheses and the aliases that take no
  // type parameters.
  const getWrittenNode = (node: ts.TypeNode): ts.TypeNode => {
    if (ts.isParenthesizedTypeNode(node)) return getWrittenNode(node.type);
    const declaration = ts.isTypeReferenceNode(node)
      ? getReferenced(node.typeName)?.declarations?.find(ts.isTypeAliasDeclaration)
      : undefined;
    return declaration === undefined || declaration.typeParameters !== undefined
      ? node
      : getWrittenNode(declaration.type);
  };
  // The node that writes a type: its alias's declaration, as a type's alias is the one that wrote
  // it, or else the node that the type comes from.
  const findWrittenNode = (type: ts.Type, node: ts.TypeNode | undefined) => {
    const declaration =
      type.aliasTypeArguments === undefined
        ? type.aliasSymbol?.declarations?.find(ts.isTypeAliasDeclaration)
        : undefined;
    const written = declaration?.type ?? node;
    return written === undefined ? undefined : getWrittenNode(written);
  };
  // A union's members as a node writes them, each at its place, with the unions written in it
  // flattened in place. A union that no node writes, such as a keyof's or an enum's, puts its
  // members at one place.
  const getWrittenMembers = (node: ts.TypeNode): WrittenMember[][] => {
    const written = getWrittenNode(node);
    if (ts.isUnionTypeNode(written)) return written.types.flatMap(getWrittenMembers);
    const type = checker.getTypeFromTypeNode(written);
    return [
      type.isUnion() ? type.types.map((member) => ({ type: member })) : [{ type, node: written }],
    ];
  };
  // The place of a type among a union's written members, or the place after them.
  const getPlace = (written: readonly WrittenMember[][], type: ts.Type) => {
    const place = written.findIndex((members) => members.some((member) => member.type === type));
    return place === -1 ? written.length : place;
  };
  // The nodes that write a collection's or a tuple's type arguments, where a node writes the type
  // itself rather than an alias that may reorder them.
  const getArgumentNodes = (type: ts.Type, node: ts.TypeNode | undefined) => {
    const written = findWrittenNode(type, node);
    if (written === undefined || checker.getTypeFromTypeNode(written) !== type) return [];
    const inner =
      ts.isTypeOperatorNode(written) && written.operator === ts.SyntaxKind.ReadonlyKeyword
        ? written.type
        : written;
    if (ts.isArrayTypeNode(inner)) return [inner.elementType];
    if (ts.isTupleTypeNode(inner)) {
      return inner.elements.map((element) =>
        ts.isNamedTupleMember(element) ? element.type : element,
      );
    }
    return ts.isTypeReferenceNode(inner) &&
      ((getReferenced(inner.typeName)?.flags ?? 0) & ts.SymbolFlags.TypeAlias) === 0
      ? (inner.typeArguments ?? [])
      : [];
  };
  // A mapped type's keys, as the program writes the union that the type maps, where it writes one
  // that names every property: the mapped type's constraint, or an argument of its alias, such as
  // Record's keys.
  const findWrittenKeys = (type: ts.Type, node: ts.TypeNode | undefined) => {
    const written = node === undefined ? undefined : getWrittenNode(node);
    const argumentNodes =
      written !== undefined &&
      ts.isTypeReferenceNode(written) &&
      type.aliasSymbol !== undefined &&
      getReferenced(written.typeName) === type.aliasSymbol
        ? (written.typeArguments ?? [])
        : (type.aliasTypeArguments ?? []).map((argument) => findWrittenNode(argument, undefined));
    const constraint = type.getSymbol()?.declarations?.find(ts.isMappedTypeNode)
      ?.typeParameter.constraint;
    const names = type.getProperties().map((property) => property.name);
    return [constraint, ...argumentNodes]
      .flatMap((candidate) =>
        candidate === undefined
          ? []
          : [
              getWrittenMembers(candidate).map((members) =>
                members.flatMap((member) =>
                  member.type.isStringLiteral() || member.type.isNumberLiteral()
                    ? [String(member.type.value)]
                    : [],
                ),
              ),
            ],
      )
      .find((keys) => names.every((name) => keys.some((place) => place.includes(name))));
  };
  // Whether a type is plain data: a primitive, a type parameter, or an array, a tuple, or an
  // object of plain data that holds at least one property that TLA+ can name, not counting
  // methods. An effect holds none, a function, a Set, and a Map aren't plain data, and a mutable
  // object fails isImmutable.
  const isData = (type: ts.Type, outer: readonly ts.Type[]): boolean => {
    if (outer.includes(type)) return true;
    const path = [...outer, type];
    if (type.isUnion()) return type.types.every((member) => isData(member, path));
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.ESSymbolLike)) {
      return false;
    }
    if (!(type.flags & ts.TypeFlags.Object)) return true;
    if (type.getCallSignatures().length > 0 || isSetType(type) || isMapType(type)) return false;
    if ((checker.isArrayType(type) || checker.isTupleType(type)) && isTypeReference(type)) {
      return checker.getTypeArguments(type).every((inner) => isData(inner, path));
    }
    const fields = getFields(type);
    return (
      fields.length > 0 && fields.every((field) => isData(checker.getTypeOfSymbol(field), path))
    );
  };
  // The properties of an object that TLA+ can name, but its methods, which a method's syntax
  // declares.
  const getFields = (type: ts.Type) =>
    type
      .getProperties()
      .filter(
        (property) =>
          isFieldName(property.name) &&
          !(property.declarations ?? []).some(
            (declaration) =>
              ts.isMethodSignature(declaration) || ts.isMethodDeclaration(declaration),
          ),
      );
  // Whether a data type's values can't change: each member's required fields are read-only, and
  // its declaration has no type parameter that is both in and out, as a mutable cell's is.
  const isImmutable = (type: ts.Type, symbol: ts.Symbol) =>
    (type.isUnion() ? type.types : [type]).every((member) =>
      getFields(member).every(
        (field) =>
          (field.flags & ts.SymbolFlags.Optional) !== 0 ||
          ((field.declarations ?? []).length > 0 &&
            (field.declarations ?? []).every(
              (declaration) =>
                (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) !== 0,
            )),
      ),
    ) &&
    (symbol.declarations ?? []).every(
      (declaration) =>
        !(ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)) ||
        (declaration.typeParameters ?? []).every((parameter) => {
          const modifiers = (ts.getModifiers(parameter) ?? []).map((modifier) => modifier.kind);
          return !(
            modifiers.includes(ts.SyntaxKind.InKeyword) &&
            modifiers.includes(ts.SyntaxKind.OutKeyword)
          );
        }),
    );
  // Whether a constructor's parameter takes only primitives or a type parameter's values.
  const isSimple = (type: ts.Type): boolean =>
    type.isUnion()
      ? type.types.every(isSimple)
      : (type.flags &
          (ts.TypeFlags.StringLike |
            ts.TypeFlags.NumberLike |
            ts.TypeFlags.BigIntLike |
            ts.TypeFlags.BooleanLike |
            ts.TypeFlags.Null |
            ts.TypeFlags.Undefined |
            ts.TypeFlags.TypeParameter)) !==
        0;
  // The type whose constructors' parameters are being listed, which take no constructed values.
  const constructing = new Set<ts.Type>();
  // A type that has no finite set of values, which the module declares, which is plain data, and
  // whose type arguments are type parameters without constraints, takes each value that the
  // module's constructors of it make: its exported functions that return it from parameters that
  // take only primitives or type parameters' values, each of each list of their arguments.
  const getConstructedDomain = (type: ts.Type, outer: readonly ts.Type[]): Domain | undefined => {
    if (constructing.size > 0) return undefined;
    const symbol = type.aliasSymbol ?? type.getSymbol();
    const typeArguments =
      type.aliasTypeArguments ?? (isTypeReference(type) ? checker.getTypeArguments(type) : []);
    if (
      symbol === undefined ||
      !(symbol.declarations ?? []).some(
        (declaration) => declaration.getSourceFile() === sourceFile,
      ) ||
      !typeArguments.every(
        (argument) =>
          (argument.flags & ts.TypeFlags.TypeParameter) !== 0 &&
          getConstraint(argument) === undefined,
      ) ||
      !isData(type, []) ||
      !isImmutable(type, symbol)
    ) {
      return undefined;
    }
    const parts = exported.flatMap((definition) => {
      const returned = getReturnType(definition);
      const parameters = getParameters(definition);
      if (
        returned === undefined ||
        (returned.aliasSymbol ?? returned.getSymbol()) !== symbol ||
        !isFieldName(definition.identifier.text) ||
        !parameters.every((parameter) => isSimple(parameter.type))
      ) {
        return [];
      }
      constructing.add(type);
      const domains = findDomains(
        parameters.map((parameter) => parameter.type),
        [...outer, type],
        parameters.map((parameter) => parameter.node.type),
      );
      constructing.delete(type);
      return Array.isArray(domains) ? [{ definition, parameters, domains }] : [];
    });
    if (parts.length === 0) return undefined;
    assumed.add(
      `${checker.typeToString(type)} := ${parts.map((part) => `${part.definition.identifier.text}(${part.parameters.map((parameter) => parameter.name).join(", ")})`).join(", ")}`,
    );
    const texts = parts.map((part) => {
      const bound = part.domains.map(() => names.getFresh("argument"));
      // The arguments are a field named by the constructor, as TLC compares two records' field
      // names before their values, which another constructor's arguments may not match.
      const record = `[constructed |-> [${part.definition.identifier.text} |-> <<${bound.join(", ")}>>]]`;
      return bound.length === 0
        ? `{${record}}`
        : `{${record} : ${bound.map((name, index) => `${name} \\in (${part.domains[index].text})`).join(", ")}}`;
    });
    return {
      text: texts.map((text) => `(${text})`).join(" \\cup "),
      size: parts.reduce(
        (sum, part) => sum + part.domains.reduce((product, domain) => product * domain.size, 1),
        0,
      ),
    };
  };
  // The domain of a type, or of the values that the module's constructors make of it.
  const findSizedDomain = (
    type: ts.Type,
    outer: readonly ts.Type[],
    node?: ts.TypeNode,
    isHeldOptional = false,
    isMethod = false,
  ): Domain | Infinite => {
    const domain = findListedDomain(type, outer, node, isHeldOptional, isMethod);
    return isUnlisted(domain) ? (getConstructedDomain(type, outer) ?? domain) : domain;
  };
  // The set of every value that a finite type allows, which TLC enumerates, as TLA+, with how many
  // values it has. outer holds the types around this one, so a type that holds itself, such as a
  // tree, has no end. node, where it's given, writes the type.
  const findListedDomain = (
    type: ts.Type,
    outer: readonly ts.Type[],
    node?: ts.TypeNode,
    isHeldOptional = false,
    isMethod = false,
  ): Domain | Infinite => {
    if (outer.includes(type)) {
      return { message: `${printType(type)} holds itself, so it has no end` };
    }
    const path = [...outer, type];
    // A type parameter takes its constraint's values, or, without one, those of one finite type
    // that TLC compares, which every type parameter takes.
    if (type.flags & ts.TypeFlags.TypeParameter) {
      const constraint = getConstraint(type);
      const domain =
        constraint === undefined
          ? { text: `{${rung.values.join(", ")}}`, size: rung.values.length }
          : findSizedDomain(constraint, path);
      if (!isUnlisted(domain)) assumed.add(`${checker.typeToString(type)} := ${domain.text}`);
      return domain;
    }
    if (type.flags & ts.TypeFlags.Boolean) return { text: "BOOLEAN", size: 2 };
    if (type.isUnion()) {
      const members = isHeldOptional
        ? type.types.filter((member) => !isMissing(member))
        : type.types;
      // The members go in the order that the program writes them, as TLC enumerates a union's
      // operands, and a set's strings, in order: literals as Undefined, Null, FALSE, and TRUE,
      // then numbers by value, then strings, and then other types, intrinsic types first. Their
      // types' ids, which TypeScript orders them by, depend on what else the run's program read
      // first, so members that nothing writes, such as a keyof's, go by their text.
      const writtenNode = findWrittenNode(type, node);
      const written = writtenNode === undefined ? [] : getWrittenMembers(writtenNode);
      const literalTypes = members
        .filter((member) => getLiteral(member) !== undefined)
        .toSorted(
          (left, right) =>
            getLiteralRank(left) - getLiteralRank(right) ||
            (left.isNumberLiteral() && right.isNumberLiteral()
              ? left.value - right.value
              : getPlace(written, left) - getPlace(written, right) ||
                compareNames(getLiteral(left) ?? "", getLiteral(right) ?? "")),
        );
      const otherTypes = members
        .filter((member) => !literalTypes.includes(member))
        .map((member) => {
          const node = written.flat().find((inner) => inner.type === member)?.node;
          const rank = INTRINSICS.findIndex((intrinsic) => member.flags === intrinsic.flag);
          return {
            member,
            node,
            place: rank === -1 ? INTRINSICS.length + getPlace(written, member) : rank,
            text: node === undefined ? printType(member) : "",
          };
        })
        .toSorted((left, right) => left.place - right.place || compareNames(left.text, right.text));
      const others = findDomains(
        otherTypes.map((inner) => inner.member),
        path,
        otherTypes.map((inner) => inner.node),
        () => false,
        isMethod,
      );
      if (!Array.isArray(others)) return others;
      if (getShape(type) === undefined) {
        return {
          message: `${printType(type)} mixes values that TLC can't compare, such as a string and a number`,
          isIncomparable: true,
        };
      }
      const enumerated = literalTypes.flatMap((member) => getLiteral(member) ?? []);
      return {
        text: [
          ...(enumerated.length > 0 ? [`{${enumerated.join(", ")}}`] : []),
          ...others.map((other) => other.text),
        ]
          .map((domain) => `(${domain})`)
          .join(" \\cup "),
        size: others.reduce((size, other) => size + other.size, enumerated.length),
      };
    }
    const literal = getLiteral(type);
    if (literal !== undefined) return { text: `{${literal}}`, size: 1 };
    if (type.flags & ts.TypeFlags.Number) return { text: "-3..3", size: 7 };
    // A BigInt from -3n to 3n, as the record of its integer, which no number's integer is.
    if (type.flags & ts.TypeFlags.BigInt) {
      const integer = names.getFresh("integer");
      return { text: `{[bigint |-> ${integer}] : ${integer} \\in -3..3}`, size: 7 };
    }
    if (type.flags & ts.TypeFlags.String) return { text: '{"", "a", "b"}', size: 3 };
    // A subclass's instances are objects, which no domain lists.
    if (
      ((isSetType(type) || isMapType(type)) && getCollectionType(type) === type) ||
      checker.isTupleType(type)
    ) {
      const elements = findDomains(
        isTypeReference(type) ? checker.getTypeArguments(type) : [],
        path,
        getArgumentNodes(type, node),
      );
      if (!Array.isArray(elements)) return elements;
      if (isSetType(type)) {
        return { text: `SUBSET (${elements[0].text})`, size: 2 ** elements[0].size };
      }
      if (isMapType(type)) {
        const keys = names.getFresh("keys");
        return {
          text: `UNION {[${keys} -> (${elements[1].text})] : ${keys} \\in SUBSET (${elements[0].text})}`,
          size: (1 + elements[1].size) ** elements[0].size,
        };
      }
      const flags = isTypeReference(type) ? (type.target as ts.TupleType).elementFlags : [];
      const isFixed = flags.every((flag) => (flag & ts.ElementFlags.Required) !== 0);
      // A tuple of required elements and a rest of one type, as [A, ...A[]], is each array of
      // that type from its required length up to the rung's.
      const elementTypes = isTypeReference(type) ? checker.getTypeArguments(type) : [];
      const isRest =
        flags.length <= rung.length + 1 &&
        flags.at(-1) === ts.ElementFlags.Rest &&
        flags.slice(0, -1).every((flag) => flag === ts.ElementFlags.Required) &&
        elementTypes.every((elementType) => elementType === elementTypes[0]);
      if (isRest) {
        assumed.add(`tuples with a rest element as arrays up to length ${rung.length}`);
        return getArrayDomain(elements[0], flags.length - 1);
      }
      if (!isFixed) {
        return getInfinite(type, "tuples with optional or rest elements can have any length");
      }
      const size = elements.reduce((product, element) => product * element.size, 1);
      if (elements.length === 0) return { text: "{<<>>}", size };
      if (elements.length > 1) {
        return { text: elements.map((element) => `(${element.text})`).join(" \\X "), size };
      }
      const element = names.getFresh("element");
      return { text: `{<<${element}>> : ${element} \\in (${elements[0].text})}`, size };
    }
    // An iterable is each array of its elements, which iterates them.
    const isIterable = getTypeName(type) === "Iterable";
    if ((checker.isArrayType(type) || isIterable) && isTypeReference(type)) {
      const element = findSizedDomain(
        checker.getTypeArguments(type)[0],
        path,
        getArgumentNodes(type, node)[0],
      );
      if (isUnlisted(element)) return element;
      assumed.add(
        isIterable
          ? `iterables as arrays up to length ${rung.length}`
          : `arrays up to length ${rung.length}`,
      );
      return getArrayDomain(element, 0);
    }
    // A callback is each table from the values of its first argument, or undefined where it takes
    // none, to those of its result, which a record holds apart from any other value.
    const callback = getCallback(type);
    if (callback !== undefined) {
      const first = callback.getParameters().at(0);
      const declaration = first?.valueDeclaration;
      if (declaration !== undefined && ts.isParameter(declaration) && declaration.dotDotDotToken) {
        return getInfinite(
          type,
          "a callback whose first parameter is a rest parameter has no table",
        );
      }
      const keyType = first === undefined ? undefined : checker.getTypeOfSymbol(first);
      const keys =
        keyType === undefined ? { text: "{Undefined}", size: 1 } : findSizedDomain(keyType, path);
      if (isUnlisted(keys)) return keys;
      const keyKind = keyType === undefined ? "model" : getShape(keyType)?.kind;
      if (!["model", "boolean", "number", "string"].includes(keyKind ?? "")) {
        return getInfinite(type, "a callback's table takes only primitives as its first argument");
      }
      const values = findSizedDomain(callback.getReturnType(), path);
      if (isUnlisted(values)) return values;
      assumed.add(
        `${isMethod ? "methods" : "callbacks"} as tables of ${first === undefined ? "no argument" : "their first argument"}`,
      );
      const table = names.getFresh("table");
      return {
        text: `{[callback |-> ${table}] : ${table} \\in [(${keys.text}) -> (${values.text})]}`,
        size: values.size ** keys.size,
      };
    }
    // A mapped type's properties, which no declaration gives, go in the order of its keys' union's
    // members, which their ids give, so the record's fields go in the order that the program writes
    // the union, or else by their names.
    const declared = type.getProperties();
    const writtenKeys = declared.some((property) => property.declarations === undefined)
      ? (findWrittenKeys(type, node) ?? [])
      : undefined;
    const getKeyPlace = (name: string) => {
      const place = writtenKeys?.findIndex((members) => members.includes(name)) ?? -1;
      return place === -1 ? (writtenKeys?.length ?? 0) : place;
    };
    const properties =
      writtenKeys === undefined
        ? declared
        : declared.toSorted(
            (left, right) =>
              getKeyPlace(left.name) - getKeyPlace(right.name) ||
              compareNames(left.name, right.name),
          );
    const isRecord =
      type.flags & ts.TypeFlags.Object &&
      type.getCallSignatures().length === 0 &&
      checker.getIndexInfosOfType(type).length === 0 &&
      properties.length > 0;
    if (!isRecord) {
      return getInfinite(type, "use a union of literals, or records, tuples, and sets of them");
    }
    // A class's instances are objects that its constructor makes, which no record stands for.
    const declaration = type.getSymbol()?.valueDeclaration;
    if (declaration !== undefined && ts.isClassLike(declaration)) {
      return getInfinite(type, "tla-ts can't list the instances of a class");
    }
    const fieldTypes = properties.map((property) => checker.getTypeOfSymbol(property));
    const fields = findDomains(
      fieldTypes,
      path,
      properties.map((property) => {
        const declaration = property.valueDeclaration;
        return declaration !== undefined &&
          (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration))
          ? declaration.type
          : undefined;
      }),
      (position) => (properties[position].flags & ts.SymbolFlags.Optional) !== 0,
      true,
    );
    if (!Array.isArray(fields)) return fields;
    const keys = properties.map((property) => property.name);
    const unnamed = keys.find((key) => !isNumericKey(key) && !isFieldName(key));
    if (unnamed !== undefined) return getInfinite(type, `TLA+ can't name the field ${unnamed}`);
    const optional = properties.flatMap((property, position) =>
      property.flags & ts.SymbolFlags.Optional ? [position] : [],
    );
    if (optional.length > 0 && keys.some(isNumericKey)) {
      return getInfinite(type, `the optional field ${properties[optional[0]].name} may be missing`);
    }
    // An object with optional fields is the record of each set of them that it holds, with its
    // other fields: a field that it holds takes the values of its type, and one that it lacks is
    // missing, as the in operator tells. An object that holds no field is the empty function, which a record of no
    // fields is.
    if (optional.length > 0) {
      // The records number the product of each field's values, one more for an optional field,
      // which may be missing: past the bound, the 2^n records of the optional fields' sets aren't
      // written out.
      const count = fields.reduce(
        (product, field, position) =>
          product * (optional.includes(position) ? field.size + 1 : field.size),
        1,
      );
      if (count > setBound) {
        return getInfinite(type, `it has more than ${setBound} values, which TLC lists at most`);
      }
      // A field's text appears in each of the 2^n records that hold it: half of them for an optional
      // field, all of them for another.
      const length = fields.reduce(
        (sum, field, position) =>
          sum +
          (keys[position].length + field.text.length + 6) *
            2 ** (optional.includes(position) ? optional.length - 1 : optional.length),
        2 ** optional.length * 8,
      );
      if (length > MOST_DOMAIN_CHARACTERS) {
        return getInfinite(
          type,
          `its ${2 ** optional.length} records' TLA+ would run past ${MOST_DOMAIN_CHARACTERS.toLocaleString("en-US")} characters`,
        );
      }
      const parts = Array.from({ length: 2 ** optional.length }, (_, mask) => {
        const held = keys.flatMap((_, position) => {
          const bit = optional.indexOf(position);
          return bit === -1 || mask & (1 << bit) ? [position] : [];
        });
        return held.length === 0
          ? { text: `{[${names.getFresh("field")} \\in {} |-> TRUE]}`, size: 1 }
          : {
              text: `[${held.map((position) => `${keys[position]} : (${fields[position].text})`).join(", ")}]`,
              size: held.reduce((product, position) => product * fields[position].size, 1),
            };
      });
      return {
        text: parts.map((part) => `(${part.text})`).join(" \\cup "),
        size: parts.reduce((sum, part) => sum + part.size, 0),
      };
    }
    const size = fields.reduce((product, field) => product * field.size, 1);
    if (!keys.some(isNumericKey)) {
      return {
        text: `[${keys.map((key, position) => `${key} : (${fields[position].text})`).join(", ")}]`,
        size,
      };
    }
    if (!keys.every(isNumericKey) || fieldTypes.some((fieldType) => fieldType !== fieldTypes[0])) {
      return {
        message: `${printType(type)} has numeric keys, so every key must be a number with the same value type`,
      };
    }
    return {
      text: `[{${keys
        .map(Number)
        .sort((left, right) => left - right)
        .join(", ")}} -> (${fields[0].text})]`,
      size,
    };
  };
  // The domain of a type, which TLC lists only where it has at most as many values as TLC puts in a
  // set.
  const findDomain = (type: ts.Type, node: ts.TypeNode | undefined): string | Infinite => {
    const domain = findSizedDomain(type, [], node);
    if (isUnlisted(domain)) return domain;
    return domain.size > setBound
      ? getInfinite(type, `it has more than ${setBound} values, which TLC lists at most`)
      : domain.text;
  };
  const getType = (node: ts.ParameterDeclaration | ts.VariableDeclaration) =>
    checker.getTypeAtLocation(node.name);
  // The values that a parameter of an exported function ranges over, which TLC lists.
  const getDomain = (parameter: Parameter) => {
    const node = parameter.node;
    const domain = findDomain(parameter.type, node.type);
    if (!isInfinite(domain)) return domain;
    const name = ts.isIdentifier(node.name) ? node.name.text : undefined;
    if (name === undefined) throw new TlaTypeScriptError(domain.message, node);
    throw new TlaTypeScriptError(
      `tla-ts can't choose every value of the parameter ${name}: ${domain.message}. Give ${name} a finite type, such as a union of literals, or records and tuples of them, or call the function from a script instead`,
      node,
    );
  };
  const getParameters = (definition: Exported): Parameter[] =>
    definition.node.parameters.map((node, index) => {
      const symbol = definition.signature?.value.getParameters()[index];
      return {
        node,
        name: node.name.getText(),
        symbol: ts.isIdentifier(node.name) ? getSymbol(node.name) : undefined,
        type:
          symbol === undefined
            ? getType(node)
            : checker.getTypeOfSymbolAtLocation(symbol, definition.declaration),
      };
    });
  // The type that a call of an exported function returns.
  const getReturnType = (definition: Exported) =>
    definition.signature?.value.getReturnType() ??
    checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  // A leading `if (!set.has(parameter)) return;` chooses the parameter from that set, as
  // `\E parameter \in set` does, so TLC doesn't enumerate the parameter's whole type. The set may
  // use parameters that earlier guards chose, as in \E a \in A : \E b \in B(a).
  const getGuard = (
    statement: ts.Statement,
    parameters: Parameter[],
    chosen: ReadonlySet<Parameter>,
  ) => {
    if (
      !ts.isIfStatement(statement) ||
      statement.elseStatement !== undefined ||
      !isBareReturn(statement.thenStatement) ||
      !ts.isPrefixUnaryExpression(statement.expression) ||
      statement.expression.operator !== ts.SyntaxKind.ExclamationToken
    ) {
      return undefined;
    }
    const operand = statement.expression.operand;
    const call = ts.isParenthesizedExpression(operand) ? operand.expression : operand;
    if (
      !ts.isCallExpression(call) ||
      !ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== "has" ||
      call.arguments.length !== 1
    ) {
      return undefined;
    }
    const findUsed = (node: ts.Node): Parameter[] => [
      ...parameters.filter(
        (parameter) => ts.isIdentifier(node) && parameter.symbol === getSymbol(node),
      ),
      ...node.getChildren().flatMap(findUsed),
    ];
    const argument = call.arguments[0];
    const parameter = parameters.find(
      (candidate) => candidate.symbol !== undefined && candidate.symbol === getSymbol(argument),
    );
    const set = call.expression.expression;
    const used = findUsed(set);
    return parameter === undefined ||
      chosen.has(parameter) ||
      !used.every((candidate) => chosen.has(candidate)) ||
      !isSetType(checker.getTypeAtLocation(set))
      ? undefined
      : { parameter, isDependent: used.length > 0 };
  };
  // The parameters that a step's leading guards choose, with whether each one's set uses others.
  const readGuards = (definition: Exported, parameters: Parameter[]) => {
    const statements = ts.isBlock(definition.body) ? definition.body.statements : [];
    const chosen = new Map<Parameter, boolean>();
    for (const statement of statements) {
      const guard = getGuard(statement, parameters, new Set(chosen.keys()));
      if (guard === undefined) break;
      chosen.set(guard.parameter, guard.isDependent);
    }
    return chosen;
  };
  // Whether a finite type's set of values is all its values, not the bounds that a number, a
  // string, or an array takes.
  const isExact = (type: ts.Type): boolean => {
    if (type.isUnion()) return type.types.every(isExact);
    if (getLiteral(type) !== undefined || type.flags & ts.TypeFlags.Boolean) return true;
    if (
      type.flags &
        (ts.TypeFlags.Number |
          ts.TypeFlags.BigInt |
          ts.TypeFlags.String |
          ts.TypeFlags.TypeParameter) ||
      checker.isArrayType(type) ||
      getTypeName(type) === "Iterable" ||
      type.getCallSignatures().length > 0 ||
      (checker.isTupleType(type) &&
        isTypeReference(type) &&
        (type.target as ts.TupleType).elementFlags.includes(ts.ElementFlags.Rest))
    ) {
      return false;
    }
    const typeArguments = isTypeReference(type) ? checker.getTypeArguments(type) : [];
    if (isSetType(type) || isMapType(type) || checker.isTupleType(type)) {
      return typeArguments.every(isExact);
    }
    return type.getProperties().every((property) => isExact(checker.getTypeOfSymbol(property)));
  };
  // The parameters that a step chooses from its guards' sets in the state: those whose types have
  // no exact finite set of values. A parameter of such a type takes each value of its type, as a
  // value outside the guard's set makes a call that writes nothing, which is no step.
  const readStateGuards = (definition: Exported, parameters: Parameter[]) =>
    new Map(
      [...readGuards(definition, parameters)].filter((entry) => {
        const type = entry[0].type;
        return isInfinite(findDomain(type, entry[0].node.type)) || !isExact(type);
      }),
    );
  // Whether an exported function is an action: one that changes state or returns nothing.
  const isStepExport = (definition: Exported) => {
    if (writesState(definition.body, new Set())) return true;
    const returnType = getReturnType(definition);
    return (
      returnType === undefined ||
      (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0
    );
  };
  // The kind of a type that no domain lists, as a note names it, where it's one of the kinds that a
  // program's code most often gives a parameter: any or unknown, a function other than a callback, a
  // class's instance, or an object with methods, alone or in a union. A type parameter or a callback
  // that no domain lists has a part that none does, which the note's reason names.
  const getUnlistedKind = (type: ts.Type): string | undefined => {
    if (type.flags & ts.TypeFlags.Any) return "any, as an untyped parameter is";
    if (type.flags & ts.TypeFlags.Unknown) return "unknown";
    if (type.isUnion()) {
      const kinds = type.types.map(getUnlistedKind);
      const kind = UNLISTED_KINDS.find((candidate) => kinds.includes(candidate));
      return kind === undefined ? undefined : `a union with ${kind}`;
    }
    if (getCallback(type) !== undefined || getTypeName(type) === "Iterable") return undefined;
    if (type.getCallSignatures().length > 0) return "a function";
    const declaration = type.getSymbol()?.valueDeclaration;
    if (declaration !== undefined && ts.isClassLike(declaration)) return "an instance of a class";
    const hasMethods = type
      .getProperties()
      .some((property) => checker.getTypeOfSymbol(property).getCallSignatures().length > 0);
    return type.flags & ts.TypeFlags.Object && hasMethods ? "an object with methods" : undefined;
  };
  // The kind of a union's value that TLC compares only with values of its kind.
  const getValueKind = (type: ts.Type) =>
    type.flags & ts.TypeFlags.NumberLike
      ? "number"
      : type.flags & ts.TypeFlags.BigIntLike
        ? "bigint"
        : type.flags & ts.TypeFlags.StringLike
          ? "string"
          : type.flags & ts.TypeFlags.BooleanLike
            ? "boolean"
            : checker.isArrayType(type) || checker.isTupleType(type)
              ? "array"
              : isSetType(type)
                ? "Set"
                : isMapType(type)
                  ? "Map"
                  : "object";
  // The kinds of the values that a union mixes, beside null and undefined, which TLC compares with
  // any value.
  const getMixedKinds = (type: ts.Type) => {
    const kinds = new Set<string>(
      (type.isUnion() ? type.types : [type])
        .filter((member) => getLiteral(member) !== "Null" && getLiteral(member) !== "Undefined")
        .map(getValueKind),
    );
    return VALUE_KINDS.filter((kind) => kinds.has(kind));
  };
  // A call's argument lists, every combination of the values of its parameters that no guard
  // chooses.
  const getListCount = (definition: Exported) => {
    const parameters = getParameters(definition);
    const guarded = isStepExport(definition) ? readGuards(definition, parameters) : new Map();
    return parameters
      .filter((parameter) => !guarded.has(parameter))
      .reduce((product, parameter) => {
        const domain = findSizedDomain(parameter.type, [], parameter.node.type);
        return isUnlisted(domain) ? product : product * BigInt(domain.size);
      }, 1n);
  };
  // Why the model calls no exported function: Node runs only a module's top level, so an export
  // runs only where TLC can choose its arguments, which it can't where a parameter takes values
  // that tla-ts can't list, and where a call of it may return.
  const getUncalledReason = (definition: Exported) => {
    if (getTag(definition) !== undefined) return undefined;
    const parameters = getParameters(definition);
    const guarded = isStepExport(definition) ? readGuards(definition, parameters) : new Map();
    const unlisted = parameters.find((parameter) => {
      const domain = findDomain(parameter.type, parameter.node.type);
      return !guarded.has(parameter) && isInfinite(domain);
    });
    // A call's argument lists, which the model lists only where they're at most as many as TLC
    // puts in a set, as it lists one parameter's values.
    const count = getListCount(definition);
    if (unlisted === undefined && count > BigInt(setBound)) {
      return `its parameters make ${count.toLocaleString("en-US")} argument lists, more than the ${setBound.toLocaleString("en-US")} it lists`;
    }
    if (unlisted !== undefined) {
      const type = unlisted.type;
      const kind = getUnlistedKind(type);
      const domain = findDomain(type, unlisted.node.type);
      const kinds = getMixedKinds(type);
      if (kind !== undefined) {
        return `its parameter ${unlisted.name} is ${kind}, whose values tla-ts can't list`;
      }
      return isInfinite(domain) && domain.isIncomparable === true && kinds.length > 1
        ? `its parameter ${unlisted.name} is a union of ${kinds.slice(0, -1).join(", ")} and ${kinds.at(-1)}, whose values TLC can't compare`
        : `its parameter ${unlisted.name} takes values it can't list: ${isInfinite(domain) ? domain.message : ""}`;
    }
    return definition.node.parameters.length === 0 &&
      (ts.isFunctionDeclaration(definition.node) ||
        ts.isArrowFunction(definition.node) ||
        ts.isFunctionExpression(definition.node)) &&
      isAlwaysThrowing(definition.node)
      ? "every call of it throws"
      : undefined;
  };
  const notes: string[] = [];
  // What the domains of an export's parameters take in place of types that have no finite set of
  // values.
  const getAssumed = (definition: Exported) => {
    assumed.clear();
    getParameters(definition).forEach((parameter) =>
      findSizedDomain(parameter.type, [], parameter.node.type),
    );
    return [...assumed].toSorted(
      (left, right) => Number(right.includes(" := ")) - Number(left.includes(" := ")),
    );
  };
  // Whether an export's domains took values in place of a type, beside an array's bound, which
  // every array takes.
  const isInstantiated = (taken: readonly string[]) =>
    taken.some((entry) => !entry.startsWith("arrays up to length"));
  // The rung of each export that the model calls: the first whose argument lists fit
  // INSTANTIATED_LISTS, where its domains took values in place of a type.
  const rungs = new Map<Exported, Rung>();
  const called = exported.filter((definition) => {
    const fitting = RUNGS.find((candidate) => {
      rung = candidate;
      return (
        !isInstantiated(getAssumed(definition)) ||
        getListCount(definition) <= BigInt(INSTANTIATED_LISTS)
      );
    });
    rung = fitting ?? RUNGS[RUNGS.length - 1];
    rungs.set(definition, rung);
    const taken = getAssumed(definition);
    const count = getListCount(definition);
    const reason =
      getUncalledReason(definition) ??
      (fitting === undefined
        ? `its parameters make ${count.toLocaleString("en-US")} argument lists with ${taken.join("; ")}, more than the ${INSTANTIATED_LISTS.toLocaleString("en-US")} it calls with values in place of a type`
        : undefined);
    const by = definition.signature === undefined ? "" : ` by ${definition.signature.note}`;
    const taking = isInstantiated(taken) ? `${by === "" ? "" : ","} with ${taken.join("; ")}` : "";
    if (reason !== undefined) notes.push(`tla-ts calls no ${definition.name}${by}: ${reason}`);
    else if (by !== "" || taking !== "")
      notes.push(`tla-ts calls ${definition.name}${by}${taking}`);
    return reason === undefined;
  });
  rung = RUNGS[0];
  const init: string[] = [];
  const next: string[] = [];
  const fairness: string[] = [];
  const predicates: string[] = [];
  const sections = new Map<string, string[]>(
    [
      "INVARIANTS",
      "PROPERTIES",
      "CONSTRAINTS",
      "ACTION_CONSTRAINTS",
      "VIEW",
      "POSTCONDITIONS",
      "ASSUME",
    ].map((section) => [section, []]),
  );
  const list = (section: string, name: string) => sections.get(section)?.push(name);
  // A state variable starts at its initializer, or at every value of its type without one, or at
  // undefined, as Node starts it, where its type has values TLC can't list, or values that only a
  // call's arguments take in place of a type, as a callback.
  variables.forEach((variable) => {
    const declaration = variable.declared.declaration;
    if (ts.isVariableDeclaration(declaration) && declaration.initializer === undefined) {
      assumed.clear();
      const domain = findDomain(getType(declaration), declaration.type);
      const taken = [...assumed];
      if (isInfinite(domain)) {
        notes.push(
          `tla-ts starts ${variable.declared.name} at undefined, as Node does: ${domain.message}`,
        );
      } else if (isInstantiated(taken)) {
        notes.push(
          `tla-ts starts ${variable.declared.name} at undefined, as Node does: only a call's arguments take ${taken.join("; ")}`,
        );
      } else {
        init.push(`${variable.name} \\in ${domain}`);
      }
    }
  });
  const quantify = (quantifier: string, bounds: string[], body: string) =>
    bounds.length === 0 ? body : `${quantifier} ${bounds.join(", ")} : ${body}`;
  const declareParameters = (definition: Exported) =>
    getParameters(definition).map((parameter) => ({
      ...parameter,
      tla: names.getFresh(parameter.name),
    }));
  // An exported function that changes state, as an action and its disjunct of Next. Each
  // parameter ranges over its type, or over the set that a guard chooses it from.
  const translateStep = (definition: Exported) => {
    const parameters = declareParameters(definition);
    const chosen = readStateGuards(definition, parameters);
    const head =
      parameters.length === 0
        ? definition.name
        : `${definition.name}(${parameters.map((parameter) => parameter.tla).join(", ")})`;
    const kind = definition.tags.has("strongFair")
      ? "SF_vars"
      : definition.tags.has("fair")
        ? "WF_vars"
        : undefined;
    if (parameters.length === 0) {
      next.push(head);
      if (kind !== undefined) fairness.push(`${kind}(${head})`);
      return;
    }
    const domains = parameters.map((parameter) =>
      chosen.has(parameter) ? GUARDED : getDomain(parameter),
    );
    const independent = parameters.flatMap((parameter, index) =>
      chosen.get(parameter) === true ? [] : [`${parameter.tla} \\in ${domains[index]}`],
    );
    // Guards run in order, so each dependent parameter is chosen after the ones its set uses.
    const step = quantify(
      "\\E",
      independent,
      [...chosen]
        .filter((entry) => entry[1])
        .reduceRight(
          (inner, entry) =>
            `\\E ${parameters.find((parameter) => parameter === entry[0])?.tla} \\in ${GUARDED} : ${inner}`,
          head,
        ),
    );
    next.push(step);
    if (kind === undefined) return;
    // Fairness holds for each parameter value when every parameter has a finite type, with the
    // guards that chose parameters kept inside the action.
    const typeDomains = parameters.map((parameter, index) =>
      chosen.has(parameter) ? findDomain(parameter.type, parameter.node.type) : domains[index],
    );
    const finite = typeDomains.flatMap((domain) => (isInfinite(domain) ? [] : [domain]));
    if (finite.length < typeDomains.length) {
      fairness.push(`${kind}(${step})`);
      return;
    }
    const conditions = parameters.flatMap((parameter) =>
      chosen.has(parameter) ? [`${parameter.tla} \\in ${GUARDED}`] : [],
    );
    fairness.push(
      quantify(
        "\\A",
        parameters.map((parameter, index) => `${parameter.tla} \\in ${finite[index]}`),
        `${kind}(${[...conditions, head].join(" /\\ ")})`,
      ),
    );
  };
  // An exported function that returns a value without asserting it, which TLC calls with every
  // argument, in every state when it reads state and once before the search otherwise.
  const translateCall = (definition: Exported) => {
    const parameters = declareParameters(definition);
    predicates.push(
      `${definition.name} == ${quantify(
        "\\A",
        parameters.map((parameter) => `${parameter.tla} \\in ${getDomain(parameter)}`),
        "LET result == TRUE IN result = result",
      )}`,
    );
    list(
      readsState(definition.declaration, new Set([definition.declaration]))
        ? "INVARIANTS"
        : "ASSUME",
      definition.name,
    );
  };
  const translateProperty = (definition: Exported, tag: string) => {
    const node = definition.node;
    const hasPreviousState = tag === "always" || tag === "actionConstraint";
    // A temporal property's parameters hold for every value, as in \A p \in P : []<>Eats(p).
    const isQuantified = TEMPORAL_TAGS.has(tag) || tag === "leadsTo";
    if (!hasPreviousState && !isQuantified && node.parameters.length > 0) {
      throw new TlaTypeScriptError(`@${tag} functions can't take parameters`, node.parameters[0]);
    }
    if (
      hasPreviousState &&
      (node.parameters.length > 1 ||
        (node.parameters.length === 1 && !ts.isIdentifier(node.parameters[0].name)))
    ) {
      throw new TlaTypeScriptError(
        "Take the state before the step as one parameter",
        node.parameters[0],
      );
    }
    const bounds = isQuantified
      ? declareParameters(definition).map(
          (parameter) => `${parameter.tla} \\in ${getDomain(parameter)}`,
        )
      : [];
    const define = (body: string) => predicates.push(`${definition.name} == ${body}`);
    const operator = TEMPORAL_TAGS.get(tag);
    if (operator !== undefined) {
      define(quantify("\\A", bounds, operator("TRUE")));
      list("PROPERTIES", definition.name);
    }
    if (tag === "leadsTo") {
      const target = (definition.tags.get("leadsTo") ?? "").split(/\s/)[0];
      if (!helpers.some((declared) => declared.name === target)) {
        throw new TlaTypeScriptError(`@leadsTo names an unknown function: ${target}`, node);
      }
      define(quantify("\\A", bounds, "TRUE ~> TRUE"));
      list("PROPERTIES", definition.name);
    }
    if (tag === "always") {
      define(node.parameters.length === 0 ? "[](TRUE)" : "[][TRUE]_vars");
      list("PROPERTIES", definition.name);
    }
    // An end state takes a step that changes nothing, as PlusCal's Terminating does.
    if (tag === "terminating") {
      define("TRUE");
      next.push(`${definition.name} /\\ UNCHANGED vars`);
    }
    const section = PREDICATE_TAGS.get(tag);
    if (section !== undefined) {
      define("TRUE");
      // An assumption that reads the state holds in the initial states instead, before the search
      // goes on.
      list(
        section === "ASSUME" &&
          readsState(definition.declaration, new Set([definition.declaration]))
          ? "INVARIANTS"
          : section,
        definition.name,
      );
    }
  };
  // An exported function is a property if a tag says so, an action if it changes state, and an
  // invariant if it returns a boolean.
  called.forEach((definition) => {
    rung = rungs.get(definition) ?? RUNGS[0];
    const tag = getTag(definition);
    if (tag !== undefined) return translateProperty(definition, tag);
    if (isStepExport(definition)) return translateStep(definition);
    const returnType = getReturnType(definition);
    if (
      definition.node.parameters.length > 0 ||
      returnType === undefined ||
      (returnType.flags & ts.TypeFlags.BooleanLike) === 0
    ) {
      return translateCall(definition);
    }
    predicates.push(`${definition.name} == TRUE`);
    list("INVARIANTS", definition.name);
  });
  rung = RUNGS[0];
  if ((sections.get("VIEW") ?? []).length > 1) {
    throw new TlaTypeScriptError("Tag only one function @view");
  }
  // A state variable that a whole number that its declaration gives starts at.
  const endless = findEndlessCount(sourceFile, checker, called.filter(isStepExport), (target) => {
    const symbol = ts.isIdentifier(target) ? getSymbol(target) : undefined;
    const declaration = symbol?.valueDeclaration;
    const initializer =
      declaration !== undefined && ts.isVariableDeclaration(declaration)
        ? declaration.initializer
        : undefined;
    const start =
      initializer !== undefined &&
      ts.isPrefixUnaryExpression(initializer) &&
      initializer.operator === ts.SyntaxKind.MinusToken
        ? initializer.operand
        : initializer;
    return (
      symbol !== undefined &&
      stateSymbols.has(symbol) &&
      start !== undefined &&
      ts.isNumericLiteral(start) &&
      Number.isSafeInteger(Number(start.text))
    );
  });
  // A model whose states never end and that checks nothing can't fail, so the compile stops. One
  // that checks something checks the states that a bounded number of steps reach first.
  const isChecking = [...sections.values()].some((names) => names.length > 0);
  if (endless !== undefined && !isChecking) {
    throw new TlaTypeScriptError(
      `tla-ts can't check a model whose states never end: an action counts ${endless.getText()} on at each step, and the model checks nothing that could stop it`,
      endless,
    );
  }
  const isGuarded = next.some((step) => step.includes(GUARDED));
  const stateNames = variables.map((variable) => variable.name);
  const text = [
    "---- MODULE Frame ----",
    ...([...stateNames, ...(isGuarded ? [GUARDED] : [])].length === 0
      ? []
      : [`VARIABLES ${[...stateNames, ...(isGuarded ? [GUARDED] : [])].join(", ")}`]),
    `vars == <<${stateNames.join(", ")}>>`,
    `Init == ${junction("/\\", ["TRUE", ...init])}`,
    `Next == ${next.length === 0 ? "FALSE" : junction("\\/", next)}`,
    `Spec == ${junction("/\\", ["Init", "[][Next]_vars", ...fairness])}`,
    ...predicates,
    ...(sections.get("ASSUME") ?? []).map((name) => `ASSUME ${name}`),
    "====",
  ].join("\n");
  const config = [
    "SPECIFICATION Spec",
    ...[...sections].flatMap((entry) =>
      entry[0] === "ASSUME" || entry[1].length === 0
        ? []
        : [entry[0], ...entry[1].map((name) => `  ${name}`)],
    ),
    ...([...tags.values()].some((statementTags) => statementTags.has("noDeadlock"))
      ? ["CHECK_DEADLOCK FALSE"]
      : []),
  ].join("\n");
  return {
    isScript: called.length === 0,
    // Whether another file of the run could change the types that the frame reads, which it reads
    // in a program of its own.
    isAugmented: program.isAugmented,
    text,
    source: parseModule(text),
    config,
    variables: stateNames.map((name): StateVariable => ({ name })),
    notes,
    bindings,
    // The signature that the model calls of each exported const whose type has call signatures,
    // by the const's name.
    signatures: new Map(
      exported.flatMap((definition) =>
        definition.signature === undefined
          ? []
          : [[definition.identifier.text, definition.node] as const],
      ),
    ),
    symmetric,
    // The state variable that the model's actions count on without end, whose search checks the
    // states within ENDLESS_STEPS steps and then stops.
    endlessCount: endless?.getText(),
  };
};

// The methods that a symmetric model may call, none of which reads an order or a text.
const SYMMETRIC_METHODS = new Set([
  "add",
  "clear",
  "delete",
  "difference",
  "get",
  "has",
  "includes",
  "intersection",
  "isDisjointFrom",
  "isSubsetOf",
  "isSupersetOf",
  "pop",
  "push",
  "set",
  "symmetricDifference",
  "union",
]);

// The binary operators that a symmetric model may apply to a value that may be a string: those
// that only test a value's identity or truthiness, or bind it.
const SYMMETRIC_OPERATORS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.CommaToken,
]);

// The values of each @symmetric type, a union of strings that the model's states may permute, as
// TLC's SYMMETRY does: the model asserts that a permutation of each type's values maps each
// behavior to another, which tla-ts takes from the tag, as TLC takes SYMMETRY. Where the code
// might tell the values apart, it stops, and where unsure it stops too: see docs/typescript.md.
const getSymmetricSets = (
  sourceFile: ts.SourceFile,
  tags: ReadonlyMap<ts.Node, Map<string, string>>,
  checker: ts.TypeChecker,
) => {
  const stop = (node: ts.Node, what: string) => {
    throw new TlaTypeScriptError(`tla-ts can't check a symmetric model ${what}`, node);
  };
  const sets = sourceFile.statements.flatMap((statement) => {
    if (tags.get(statement)?.has("symmetric") !== true) return [];
    if (!ts.isTypeAliasDeclaration(statement)) return stop(statement, "whose tag isn't on a type");
    const members = ts.isUnionTypeNode(statement.type) ? statement.type.types : [statement.type];
    // A value that isn't a name, or that names a property of every object, reads otherwise as a
    // key or a number.
    const values = members.map((member) =>
      ts.isLiteralTypeNode(member) &&
      ts.isStringLiteral(member.literal) &&
      /^[A-Za-z_$][\w$]*$/.test(member.literal.text) &&
      !(member.literal.text in Object.prototype)
        ? member.literal.text
        : stop(member, "whose symmetric type isn't a union of names that no object has"),
    );
    return values.length < 2 ? stop(statement, "whose symmetric type has one value") : [values];
  });
  if (sets.length === 0) return sets;
  const named = new Set(sets.flat());
  if (named.size !== sets.flat().length) stop(sourceFile, "whose symmetric types share a value");
  // A type that may hold a string that no literal type gives, or any value.
  const isWide = (type: ts.Type) =>
    (type.isUnion() ? type.types : [type]).some(
      (inner) =>
        (inner.flags &
          (ts.TypeFlags.String |
            ts.TypeFlags.TemplateLiteral |
            ts.TypeFlags.StringMapping |
            ts.TypeFlags.Any |
            ts.TypeFlags.Unknown |
            ts.TypeFlags.TypeVariable |
            ts.TypeFlags.Index |
            ts.TypeFlags.Conditional |
            ts.TypeFlags.Substitution)) !==
          0 ||
        ((inner.flags & ts.TypeFlags.Object) !== 0 &&
          (inner.getSymbol()?.name === "Object" ||
            (checker.getPropertiesOfType(inner).length === 0 &&
              inner.getCallSignatures().length === 0))),
    );
  const isStringy = (node: ts.Expression) => {
    const type = checker.getTypeAtLocation(node);
    return (
      isWide(type) ||
      (type.isUnion() ? type.types : [type]).some(
        (inner) => (inner.flags & ts.TypeFlags.StringLiteral) !== 0,
      )
    );
  };
  // An object that a string indexes otherwise than by its own keys.
  const isIndexed = (node: ts.Expression) => {
    const type = checker.getTypeAtLocation(node);
    return (
      isStringy(node) ||
      checker.isArrayLikeType(type) ||
      checker.getIndexInfoOfType(type, ts.IndexKind.Number) !== undefined ||
      type.getCallSignatures().length > 0
    );
  };
  // A module-level object literal whose keys are every value of a symmetric type, each with the
  // same initializer that reads nothing and calls nothing but a Set's or Map's constructor,
  // makes a symmetric value.
  const isInert = (node: ts.Expression): boolean =>
    ts.isNumericLiteral(node) ||
    (ts.isStringLiteral(node) && !named.has(node.text)) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(node) && node.text === "undefined") ||
    (ts.isArrayLiteralExpression(node) && node.elements.length === 0) ||
    (ts.isObjectLiteralExpression(node) && node.properties.length === 0) ||
    (ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (node.expression.text === "Set" || node.expression.text === "Map") &&
      (node.arguments ?? []).length === 0);
  const isSymmetricLiteral = (node: ts.ObjectLiteralExpression) => {
    const keys = node.properties.map((property) =>
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      isInert(property.initializer)
        ? property.name.text
        : undefined,
    );
    const texts = node.properties.map((property) =>
      ts.isPropertyAssignment(property) ? property.initializer.getText() : undefined,
    );
    return sets.some(
      (values) =>
        keys.length === values.length &&
        values.every((value) => keys.includes(value)) &&
        texts.every((text) => text !== undefined && text === texts[0]),
    );
  };
  const isNameOf = (node: ts.Identifier) =>
    ts.isPropertyAccessExpression(node.parent) ||
    ts.isPropertyAssignment(node.parent) ||
    ts.isShorthandPropertyAssignment(node.parent) ||
    ts.isBindingElement(node.parent) ||
    ts.isMethodDeclaration(node.parent) ||
    ts.isPropertyDeclaration(node.parent) ||
    ts.isGetAccessorDeclaration(node.parent) ||
    ts.isSetAccessorDeclaration(node.parent) ||
    ts.isEnumMember(node.parent);
  // A function that the module declares, whose body the checks read too.
  const isModuleFunction = (node: ts.Expression) =>
    ts.isIdentifier(node) &&
    (checker.getSymbolAtLocation(node)?.declarations ?? []).some(
      (declaration) =>
        declaration.getSourceFile() === sourceFile &&
        (ts.isFunctionDeclaration(declaration) ||
          (ts.isVariableDeclaration(declaration) &&
            (declaration.parent.flags & ts.NodeFlags.Const) !== 0 &&
            declaration.initializer !== undefined &&
            (ts.isArrowFunction(declaration.initializer) ||
              ts.isFunctionExpression(declaration.initializer)))),
    );
  // A method of a Set, a Map, or an array that reads no order or text.
  const isSymmetricMethod = (node: ts.Expression) => {
    if (!ts.isPropertyAccessExpression(node) || !SYMMETRIC_METHODS.has(node.name.text)) {
      return false;
    }
    const type = checker.getTypeAtLocation(node.expression);
    return (type.isUnion() ? type.types : [type]).every((inner) =>
      ["Set", "ReadonlySet", "Map", "ReadonlyMap", "Array", "ReadonlyArray"].includes(
        inner.getSymbol()?.name ?? "",
      ),
    );
  };
  const visit = (node: ts.Node, isTopLevel: boolean): void => {
    if (ts.isTypeNode(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      return;
    }
    if (ts.isObjectLiteralExpression(node) && isTopLevel && isSymmetricLiteral(node)) {
      return;
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      named.has(node.text)
    ) {
      stop(node, `that names the value "${node.text}" of a symmetric type`);
    }
    if (ts.isIdentifier(node) && named.has(node.text) && isNameOf(node)) {
      stop(node, `that names the value "${node.text}" of a symmetric type`);
    }
    if (ts.isExpression(node) && isWide(checker.getTypeAtLocation(node))) {
      stop(node, "with a value that may be any string");
    }
    if (
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isSpreadElement(node) ||
      ts.isSpreadAssignment(node) ||
      ts.isArrayBindingPattern(node) ||
      (ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isArrayLiteralExpression(node.left)) ||
      (ts.isYieldExpression(node) && node.asteriskToken !== undefined) ||
      ts.isTemplateExpression(node) ||
      ts.isTaggedTemplateExpression(node)
    ) {
      stop(node, "that iterates, spreads, or formats a value");
    }
    if (
      ts.isBinaryExpression(node) &&
      !SYMMETRIC_OPERATORS.has(node.operatorToken.kind) &&
      (isStringy(node.left) || isStringy(node.right))
    ) {
      stop(node, "that compares, converts, or joins a value that may be a string");
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      node.operator !== ts.SyntaxKind.ExclamationToken &&
      isStringy(node.operand)
    ) {
      stop(node, "that converts a value that may be a string");
    }
    if (
      (ts.isPropertyAccessExpression(node) && isStringy(node.expression)) ||
      (ts.isElementAccessExpression(node) &&
        isStringy(node.argumentExpression) &&
        isIndexed(node.expression))
    ) {
      stop(node, "that reads a property of a value by a string that may name it otherwise");
    }
    if (
      (ts.isCallExpression(node) &&
        !isModuleFunction(node.expression) &&
        !isSymmetricMethod(node.expression)) ||
      (ts.isNewExpression(node) &&
        !(
          ts.isIdentifier(node.expression) &&
          (node.expression.text === "Set" || node.expression.text === "Map")
        ))
    ) {
      stop(node, "that calls a function that may read an order or a text");
    }
    ts.forEachChild(node, (child) =>
      visit(child, isTopLevel && !ts.isFunctionLike(child) && !ts.isClassLike(child)),
    );
  };
  sourceFile.statements.forEach((statement) => visit(statement, true));
  return sets;
};

// The state variable that a statement counts up or down by a whole number, from a whole number
// that its declaration gives, at each run: a step of one, a step of a literal, or a step of a value
// of a union of whole literals of one sign. A for-in over an object literal with a key runs its body
// at least once.
const getCounted = (
  statement: ts.Statement,
  isState: (target: ts.Expression) => boolean,
  getLiterals: (node: ts.Node) => ts.Type[] | undefined,
): ts.Expression | undefined => {
  if (ts.isForInStatement(statement)) {
    const body = ts.isBlock(statement.statement)
      ? statement.statement.statements
      : [statement.statement];
    const counted = body.map((inner) => getCounted(inner, isState, getLiterals));
    const object = statement.expression;
    const hasKey =
      ts.isObjectLiteralExpression(object) &&
      object.properties.some(
        (property) =>
          ts.isShorthandPropertyAssignment(property) ||
          (ts.isPropertyAssignment(property) &&
            !ts.isComputedPropertyName(property.name) &&
            property.name.text !== "__proto__"),
      );
    return hasKey && counted.length > 0 && !counted.includes(undefined) ? counted[0] : undefined;
  }
  const expression = ts.isExpressionStatement(statement) ? statement.expression : undefined;
  const steps =
    expression !== undefined && ts.isBinaryExpression(expression)
      ? getLiterals(expression.right)?.map((type) =>
          type.isNumberLiteral() && Number.isSafeInteger(type.value) ? type.value : 0,
        )
      : undefined;
  const target =
    expression !== undefined &&
    (ts.isPrefixUnaryExpression(expression) || ts.isPostfixUnaryExpression(expression)) &&
    (expression.operator === ts.SyntaxKind.PlusPlusToken ||
      expression.operator === ts.SyntaxKind.MinusMinusToken)
      ? expression.operand
      : expression !== undefined &&
          ts.isBinaryExpression(expression) &&
          (expression.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ||
            expression.operatorToken.kind === ts.SyntaxKind.MinusEqualsToken) &&
          steps !== undefined &&
          (steps.every((step) => step > 0) || steps.every((step) => step < 0))
        ? expression.left
        : undefined;
  return target !== undefined && isState(target) ? target : undefined;
};

// The state variable that an action counts on, where every action only counts state variables, so
// that each step reaches a state that no step before reached, and the states never end.
const findEndlessCount = (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  called: readonly Exported[],
  isState: (target: ts.Expression) => boolean,
): ts.Expression | undefined => {
  // A declaration runs nothing, as a string as a statement, such as a "use strict" directive, does.
  const isInertStatement = (statement: ts.Statement) =>
    ts.isFunctionDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isImportDeclaration(statement) ||
    ts.isExportDeclaration(statement) ||
    (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) ||
    (ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.every(
        (declaration) =>
          declaration.initializer === undefined || isInertValue(declaration.initializer),
      ));
  if (!sourceFile.statements.every(isInertStatement)) return undefined;
  // The values of a type that is a union of literals, which TLC takes each of.
  const getLiterals = (node: ts.Node) => {
    const type = checker.getTypeAtLocation(node);
    const types = type.isUnion() ? type.types : [type];
    return types.every(
      (inner) => inner.isLiteral() || (inner.flags & ts.TypeFlags.BooleanLiteral) !== 0,
    )
      ? types
      : undefined;
  };
  // An action with a parameter of another type may have none to take, which leaves it disabled.
  const counts = called.map((definition) =>
    !definition.node.parameters.every((parameter) => getLiterals(parameter.name) !== undefined)
      ? [undefined]
      : (ts.isBlock(definition.body)
          ? definition.body.statements
          : [ts.factory.createExpressionStatement(definition.body)]
        ).map((statement) => getCounted(statement, isState, getLiterals)),
  );
  const counted = counts.flat().at(0);
  return counted === undefined || counts.some((count) => count.includes(undefined))
    ? undefined
    : counted;
};
