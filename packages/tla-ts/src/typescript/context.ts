import ts from "@typescript/typescript6";
import type { Expression, OperatorDefinition, OperatorParam, SourceLocation } from "../ast";
import { getTypeNames, JAVASCRIPT_OPERATORS } from "./javascript";
import { BUILT_INS, HOST_GLOBAL_KEYS, NODE_GLOBALS } from "./built-ins";
import { getErrorClass, isNativeErrorName, isPrototypeRead, NATIVE_ERRORS } from "./exceptions";
import { type Collection, getBuiltIn, isHeldBuiltInObject } from "./intrinsics";
import {
  type BufferName,
  getArrayMethodCall,
  getKind,
  isAnyPlace,
  isBufferName,
  isCollectionName,
  isHeapArray,
  isHeapSetOrMap,
} from "./types";
import { TlaTypeScriptError } from "../errors";
import { isCommonJsFile } from "./common-js";
import { createNames, type Names } from "./names";
import { getBindingNames, getLexicalNames } from "./early-errors";
import { getKeptReads } from "./narrowing";
import { mayThrow } from "./functions";
import { getGetterKeys, isProxyOperation } from "./protocols";
import type { Namespace } from "./namespaces";
import type { Link } from "./regions";
import { apply, define, identifier, ifExpression, index, letExpression, string } from "./tla";

export interface Definition {
  name: string;
  parameters: OperatorParam[];
  readsState: boolean;
}

export interface SelfCall {
  name: string;
  changed: ts.Symbol[];
  // The function that each parameter that takes one runs, the same in every call.
  functions: (FunctionNode | undefined)[];
}

// A helper that a statement calls, compiled once as an operator beside the top-level definitions.
// It takes the arguments, the names it reads from outside itself, and the state, and gives how its
// body ended, its value or what it threw, the message and the place of a throw, and the state.
export interface SharedCall {
  name: string;
  // Whether its body can end in a throw, which the operator gives its caller to catch or stop at.
  isThrowing: boolean;
  captured: ts.Symbol[];
  // The function that each parameter takes, which the operator calls where the body calls it.
  callbacks: ReadonlyMap<ts.Symbol, FunctionNode>;
  // The function that each name it reads holds where its caller calls it, which no value carries.
  held: ReadonlyMap<ts.Symbol, FunctionNode>;
  // The state and the names from outside that it changes, which it gives back in that order.
  changed: ts.Symbol[];
  // The heap and the variables that it and what it runs read or change, which it takes.
  state: ts.Symbol[];
  // The lets and consts of the script that its caller hasn't declared yet, which it neither takes
  // nor gives back, and whose reads throw.
  uninitialized: ts.Symbol[];
  parameters: OperatorParam[];
  // Whether a call inside its own body, or a body that it runs, calls it.
  isRecursive: boolean;
  // Whether its body can end but by a throw, as a call inside its own body takes it to.
  isReturning: boolean;
}

// A helper that can run as an operator: the names that it and the functions it runs read from
// outside them, and the state and those names that it changes.
export interface SharedHelper {
  read: ts.Symbol[];
  changed: ts.Symbol[];
  // The variables that a function or a class of the script names, which its operator takes.
  state: ts.Symbol[];
}

export interface Passed {
  node: ts.Expression;
  value: Expression;
}

// A regexp that a script makes, as translateRegExp compiles it.
export interface MadeRegExp {
  pattern: string;
  flags: string;
  source: string;
  node: ts.Node;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, Expression>;
  // Helper functions and constants, compiled when first referenced.
  definitions: Map<ts.Declaration, Definition>;
  // The operator of each helper that calls itself where a statement changed the state that it
  // reads, which takes that state.
  stateCalls: Map<ts.Node, Definition>;
  // Helpers being compiled or inlined, to detect recursion.
  inProgress: Set<ts.Node>;
  recursive: Set<ts.Declaration>;
  // The recursive operator of each function that changes state and calls itself, while its body
  // compiles, with what it changes.
  selfCalls: Map<ts.Node, SelfCall[]>;
  // The helpers that can run as operators, which tla-ts finds before it compiles the code.
  sharedHelpers: Map<ts.Node, SharedHelper>;
  // The functions that a helper's operator can call where a parameter takes them, with what they
  // read and change outside them.
  sharedCallbacks: Map<ts.Node, SharedHelper>;
  // The operators of each helper, one for each kind of call.
  sharedCalls: Map<ts.Node, SharedCall[]>;
  // Where each throw that an operator gives its caller is, by its place, and the operator that
  // stops there where nothing catches it.
  throwPlaces: SourceLocation[];
  thrownName: string | undefined;
  output: OperatorDefinition[];
  // The TypeScript that each emitted definition or expression compiles from.
  links: Link[];
  // String literals of @symmetric types, which become model values.
  modelValues: Map<string, string>;
  constructors: Map<ts.Symbol | ts.Node, string>;
  // Model values and helper operators that the spec uses.
  prelude: Set<"Null" | "Undefined" | "Rem" | "Quot" | "JavaScript" | "Unresolvable">;
  // The calls that the exported function being compiled makes and tla-ts can't compile.
  unknowns: Unknowns | undefined;
  heap: ts.Symbol | undefined;
  // The built-in objects, by path, that a script names.
  builtIns: Set<string>;
  // Whether a script reads a property of a function that may be a built-in accessor, whose objects
  // the heap then holds.
  isAccessorRead: boolean;
  // Whether Function.prototype.toString reads the source texts of the script's functions.
  isSourceTextRead: boolean;
  // The literal that each function a script holds as a value returns, by its model value's name,
  // for the functions that return only a literal.
  constantFunctions: Map<string, Expression>;
  // The object of each function that a model value stands for, by the value's name, which the heap
  // reads the function's properties from, and the object that its prototype property starts with.
  functionObjects: Map<string, FunctionObject>;
  // Whether a script names NaN, Infinity, or -0, so that its numbers compute as JavaScript's.
  hasSpecialNumbers: boolean;
  // Whether a script iterates a set or a map, so that each keeps the order of its keys.
  hasOrderedCollections: boolean;
  // Whether the heap holds every map that a script makes, as a map off the heap may be the same TLA+
  // value as an array.
  isEveryMapHeld: boolean;
  // The file of a script without exported actions that reports what it doesn't catch as Node does,
  // and whether Node runs it as an ES module.
  script: { sourceFile: ts.SourceFile; isEsModule: boolean } | undefined;
  // The files and declarations that a model's code reaches by name, under which only code runs,
  // or undefined before tla-ts finds them.
  reached: ReadonlySet<ts.Node> | undefined;
  // The model values that stand for the well-known symbols and for the symbols a script makes.
  symbols: string[];
  // The model values that stand for the numbers that a script's literals give and that aren't
  // integers, and for their negations, by number.
  fractions: Map<number, string>;
  // The numbers that a script's literals give past its integers and fractions, and their
  // negations, whose text the JavaScript module writes.
  doubles: Set<number>;
  // The array literals, new sets and maps, and the rest elements, variables, parameters, fields,
  // and functions that hold them, which the heap holds.
  heapCollections: Set<ts.Node>;
  // The built-in methods that each file reads as values, as obj.pop = Array.prototype.pop does,
  // which a call of a key whose type doesn't tell which function it holds may run.
  storedBuiltIns: ReadonlyMap<ts.SourceFile, ReadonlySet<string>>;
  // The closures of each file, which a call through a value whose type has calls may run.
  closures: ReadonlyMap<ts.SourceFile, readonly Closure[]>;
  // The vars, parameters, and declared functions of the functions of a script that run once, which
  // hold one value each, as the script's own do, so that the functions they make read them from
  // the state rather than from an environment.
  onceLocals: ReadonlySet<ts.Symbol>;
  // The functions of a script that run once, whose locals the state holds.
  onceFunctions: ReadonlySet<ts.Node>;
  // The statements that run at most once, however often their functions run, as findGuardedStatements
  // finds them.
  guardedStatements: ReadonlySet<ts.Node>;
  // The functions of each file that a value may hold where tla-ts can't tell which, once the
  // script's heap is known.
  functionCandidates: ReadonlyMap<ts.SourceFile, readonly FunctionNode[]>;
  // The proxies of arrays, sets, and maps that a script makes, and the variables, parameters, calls,
  // and reads of Proxy.revocable's proxy that hold them, which tla-ts reads as objects.
  collectionProxies: Set<ts.Node>;
  // The reads of the global object's built-ins that their statements check, as a script that uses
  // the global object as a value may change them.
  checkedGlobals: ReadonlySet<ts.Identifier>;
  // The vars that stand for the globals that writes outside strict mode make.
  implicitGlobals: ReadonlySet<ts.Symbol>;
  // The generator functions that a script declares at its top, or that a variable there holds,
  // whose prototype objects the heap holds from the start, by the place on the heap of each.
  generatorPrototypes: Map<ts.FunctionDeclaration | ts.FunctionExpression, number>;
  // The modules whose namespace objects a script reads, which the heap holds from the start, after
  // the generator prototypes, and which take the modules' exports once the modules have run.
  namespaces: ReadonlyMap<ts.SourceFile, Namespace>;
  // The sites of the tagged templates other than String.raw's, each of whose template object and
  // its raw strings' array the heap holds from the start, after the namespace objects.
  templateSites: readonly ts.TaggedTemplateExpression[];
  // Whether a script gives Array.prototype or Object.prototype properties, which an array reads
  // past its end.
  hasInheritedElements: boolean;
  // The code units outside ASCII that a script's strings may hold: those its text writes, and those
  // of each case of the code points they make.
  characters: Set<number>;
  // The texts of the literals too long for the module to tell the codes of their code units.
  longLiterals: Set<string>;
  // The regexps that the script makes, whose searches on those texts tla-ts decides as it compiles.
  regExps: MadeRegExp[];
  // The argument that an inlined call passed, by the name that binds the parameter that took it.
  passed: Map<string, Passed>;
  // The names that each file's code assigns, and that its calls pass as objects, which tla-ts
  // finds once before it compiles the code.
  assignedNames: Map<ts.SourceFile, Set<ts.Symbol>>;
  objectArguments: Map<ts.SourceFile, Set<ts.Symbol>>;
  // The names whose values each file's functions return or put in object literals.
  escapedNames: Map<ts.SourceFile, Set<ts.Symbol>>;
  // Whether each read of a name or a property that another function assigns keeps what TypeScript
  // narrowed it to, which tla-ts finds once before it compiles the code.
  keptReads: ReadonlyMap<ts.Node, boolean>;
  // What each function that a statement runs changes, with the functions that it runs in turn, by
  // the functions that the paths bind to the parameters that they call.
  changeSummaries: Map<string, Map<ts.Node, ChangeSummary>>;
  // What running each node of the model's code changes where no parameter holds a function, which
  // tla-ts finds once before it compiles the code.
  effects: ReadonlyMap<ts.Node, Effects>;
}

// What running a node changes, apart from what the functions that it runs change.
export interface Effects {
  // The names that it assigns, and the heap where it changes the heap other than by making an error.
  changed: ts.Symbol[];
  // Whether it makes an error, which changes the heap unless the caller ignores its identity.
  isErrorMade: boolean;
  // The functions that it runs.
  called: ts.Node[];
  // The parameters that it calls or passes, which a path may bind to functions.
  parameters: ts.Symbol[];
}

export interface FunctionObject {
  object: Expression;
  prototype: { key: string; object: Expression } | undefined;
}

export interface ChangeSummary {
  changed: Set<ts.Symbol>;
  // Whether it makes an error, which changes the heap unless the caller ignores its identity.
  isErrorMade: boolean;
  // The parameters that it calls or passes, which a path may bind to functions.
  parameters: Set<ts.Symbol>;
}

export interface Unknown {
  name: string;
  domain: Expression;
  node: ts.Node;
}

interface Unknowns {
  owner: ts.Node;
  values: Unknown[];
}

export interface MethodCall extends ts.CallExpression {
  readonly expression: ts.PropertyAccessExpression;
}

export type FunctionNode =
  | ts.FunctionDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression
  | ts.MethodDeclaration
  | ts.ConstructorDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration;

export type HelperDeclaration = ts.FunctionDeclaration | ts.VariableDeclaration;

// TypeScript narrows a variable or a property at a read from what the read's function assigns
// before it, and keeps that across a call, though a function that the call runs may assign it a
// value of another type. A read of one that another function assigns has its declared type, unless
// nothing that may run another function's code comes between it and what narrowed it. A computed
// key, as in o[key] = value, may assign any property, or any index of an array.
const anyProperty = Symbol("any property");
const anyIndex = Symbol("any index");

export const PRIMITIVE_FLAGS =
  ts.TypeFlags.StringLike |
  ts.TypeFlags.NumberLike |
  ts.TypeFlags.BigIntLike |
  ts.TypeFlags.BooleanLike |
  ts.TypeFlags.EnumLike |
  ts.TypeFlags.ESSymbolLike |
  ts.TypeFlags.Null |
  ts.TypeFlags.Undefined |
  ts.TypeFlags.Void |
  ts.TypeFlags.Never;

const ACCESSOR_CALLS = new Set([
  "defineProperty",
  "defineProperties",
  "setPrototypeOf",
  "create",
  "__defineGetter__",
  "__defineSetter__",
]);

const CONVERSION_NAMES = new Set(["valueOf", "toString", "toPrimitive"]);

// What tla-ts finds before it compiles about the reads that another function may assign: the type
// each read's declaration gives it, and whether each read keeps TypeScript's narrowing.
interface DeclaredReads {
  getDeclaredType: (node: ts.Node) => ts.Type | undefined;
  keptReads: ReadonlyMap<ts.Node, boolean>;
}

const getDeclaredReads = (
  checker: ts.TypeChecker,
  files: readonly ts.SourceFile[],
): DeclaredReads => {
  // TypeScript's control flow runs through a function that a call runs where it's written, unless
  // it's async or a generator, so it narrows what that function assigns. Where the function names
  // itself, a later call may run it again.
  const isInlined = (node: ts.Node) => {
    const name = ts.isFunctionExpression(node) ? node.name : undefined;
    return (
      (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
      isCalledInPlace(node) &&
      isPlain(node) &&
      (name === undefined ||
        findNodes(
          node.body,
          (inner): inner is ts.Identifier => ts.isIdentifier(inner) && inner.text === name.text,
        ).length === 0)
    );
  };
  const getFunction = (node: ts.Node): ts.Node => {
    const found = ts.findAncestor(node.parent, ts.isFunctionLike) ?? node.getSourceFile();
    return isInlined(found) ? getFunction(found) : found;
  };
  const getWrittenKey = (name: ts.Expression) => {
    if (ts.isIdentifier(name)) return getSymbol(name, checker);
    if (ts.isPropertyAccessExpression(name)) return name.name.text;
    if (!ts.isElementAccessExpression(name)) return undefined;
    const key = name.argumentExpression;
    const receiver = checker.getNonNullableType(checker.getTypeAtLocation(name.expression));
    return ts.isStringLiteralLike(key) || ts.isNumericLiteral(key)
      ? key.text
      : checker.isArrayType(receiver) || checker.isTupleType(receiver)
        ? anyIndex
        : anyProperty;
  };
  // The functions that write each name or key, in each file.
  const writers = new Map(
    files.map((file) => {
      const found = new Map<ts.Symbol | string | symbol, Set<ts.Node>>();
      findNodes(file, (inner): inner is ts.Node => getAssignedTarget(inner) !== undefined).forEach(
        (assignment) => {
          const target = getAssignedTarget(assignment);
          (target === undefined ? [] : getWrittenNames(target)).forEach((name) => {
            const key = getWrittenKey(name);
            if (key !== undefined) {
              found.set(key, new Set([...(found.get(key) ?? []), getFunction(assignment)]));
            }
          });
        },
      );
      return [file, found];
    }),
  );
  const isWrittenElsewhere = (key: ts.Symbol | string | symbol, node: ts.Node) =>
    [...(writers.get(node.getSourceFile())?.get(key) ?? [])].some(
      (writer) => writer !== getFunction(node),
    );
  const sources = files.filter((file) => !file.isDeclarationFile);
  // The types of the objects that a getter, a setter, or a proxy's trap may run for.
  const accessorTypes = sources.flatMap((file) =>
    findNodes(file, (inner): inner is ts.Node => inner !== undefined).flatMap((node) => {
      const hasAccessor =
        (ts.isObjectLiteralExpression(node) || ts.isClassLike(node)) &&
        (ts.isObjectLiteralExpression(node) ? node.properties : node.members).some(
          (member) => ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member),
        );
      const symbol = ts.isClassLike(node)
        ? checker.getSymbolAtLocation(node.name ?? node)
        : undefined;
      if (hasAccessor && symbol !== undefined) {
        return [checker.getDeclaredTypeOfSymbol(symbol), checker.getTypeOfSymbol(symbol)];
      }
      if (hasAccessor) return [checker.getTypeAtLocation(node)];
      if (ts.isNewExpression(node) && getBuiltIn(node.expression, { checker }) === "Proxy") {
        return [checker.getTypeAtLocation(node)];
      }
      if (
        !ts.isCallExpression(node) ||
        !ts.isPropertyAccessExpression(node.expression) ||
        !ACCESSOR_CALLS.has(node.expression.name.text)
      ) {
        return [];
      }
      const method = node.expression.name.text;
      // Any object has __defineGetter__, but only Object and Reflect give the others.
      const owner = getBuiltIn(node.expression.expression, { checker });
      if (!method.startsWith("__") && owner !== "Object" && owner !== "Reflect") return [];
      // A null prototype without descriptors gives an object nothing to inherit an accessor from.
      const prototype = node.arguments[method === "setPrototypeOf" ? 1 : 0];
      const isBare =
        (method === "create" || method === "setPrototypeOf") &&
        node.arguments.length === (method === "create" ? 1 : 2) &&
        prototype?.kind === ts.SyntaxKind.NullKeyword;
      const changed = isBare
        ? undefined
        : method === "create"
          ? node
          : method.startsWith("__")
            ? node.expression.expression
            : node.arguments[0];
      return changed === undefined ? [] : [checker.getTypeAtLocation(changed)];
    }),
  );
  const isAccessed = (receiver: ts.Expression) => {
    if (accessorTypes.length === 0) return false;
    const type = checker.getTypeAtLocation(receiver);
    return (
      (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
      accessorTypes.some(
        (accessor) =>
          checker.isTypeAssignableTo(accessor, type) || checker.isTypeAssignableTo(type, accessor),
      )
    );
  };
  const getDeclaredType = (node: ts.Node) => {
    const symbol = ts.isIdentifier(node)
      ? getSymbol(node, checker)
      : ts.isPropertyAccessExpression(node)
        ? checker.getSymbolAtLocation(node.name)
        : ts.isElementAccessExpression(node) &&
            (ts.isStringLiteralLike(node.argumentExpression) ||
              ts.isNumericLiteral(node.argumentExpression))
          ? checker.getSymbolAtLocation(node.argumentExpression)
          : undefined;
    const declaration = symbol?.valueDeclaration;
    if (symbol === undefined || declaration === undefined) return undefined;
    if (ts.isIdentifier(node)) {
      return (ts.isVariableDeclaration(declaration) || ts.isParameter(declaration)) &&
        isWrittenElsewhere(symbol, node)
        ? checker.getTypeOfSymbol(symbol)
        : undefined;
    }
    const isIndex = symbol.name === "length" || String(Number(symbol.name)) === symbol.name;
    // A getter or a proxy's trap may give another value at each read.
    return isWrittenElsewhere(symbol.name, node) ||
      isWrittenElsewhere(anyProperty, node) ||
      (isIndex && isWrittenElsewhere(anyIndex, node)) ||
      ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
        isAccessed(node.expression))
      ? checker.getTypeOfSymbol(symbol)
      : undefined;
  };
  // Whether a script gives an object its own valueOf, toString, or Symbol.toPrimitive.
  const isConverting = sources.some(
    (file) =>
      findNodes(
        file,
        (inner): inner is ts.Identifier | ts.StringLiteral =>
          (ts.isIdentifier(inner) || ts.isStringLiteral(inner)) &&
          CONVERSION_NAMES.has(inner.text) &&
          (ts.isStringLiteral(inner) ||
            inner.text === "toPrimitive" ||
            ts.getNameOfDeclaration(inner.parent as ts.Declaration) === inner ||
            (ts.isPropertyAccessExpression(inner.parent) &&
              getAssignedTarget(inner.parent.parent) === inner.parent)),
      ).length > 0,
  );
  const isConverted = (operand: ts.Expression) => {
    const type = checker.getTypeAtLocation(operand);
    return (
      isConverting &&
      (type.isUnion() ? type.types : [type]).some(
        (member) => (member.flags & PRIMITIVE_FLAGS) === 0,
      )
    );
  };
  const symbolIds = new Map<ts.Symbol, number>();
  const getReference = (node: ts.Expression): string | undefined => {
    const inner = skipCasts(node);
    const symbol = ts.isIdentifier(inner) ? getSymbol(inner, checker) : undefined;
    if (symbol !== undefined && !symbolIds.has(symbol)) symbolIds.set(symbol, symbolIds.size);
    if (symbol !== undefined) return String(symbolIds.get(symbol));
    if (inner.kind === ts.SyntaxKind.ThisKeyword) return "this";
    const name = ts.isPropertyAccessExpression(inner)
      ? inner.name.text
      : ts.isElementAccessExpression(inner) &&
          (ts.isStringLiteralLike(inner.argumentExpression) ||
            ts.isNumericLiteral(inner.argumentExpression))
        ? inner.argumentExpression.text
        : undefined;
    const base =
      name !== undefined &&
      (ts.isPropertyAccessExpression(inner) || ts.isElementAccessExpression(inner))
        ? getReference(inner.expression)
        : undefined;
    return base === undefined ? undefined : `${base}.${name}`;
  };
  const queries = {
    checker,
    getDeclared: getDeclaredType,
    getReference,
    isInlined,
    isAccessed,
    isConverted,
  };
  // Each function's walk, over every function that a call doesn't run where it's written.
  const roots = sources.flatMap((file) => [
    file,
    ...findNodes(file, ts.isFunctionLike).filter((node) => !isInlined(node)),
  ]);
  return {
    getDeclaredType,
    keptReads: new Map(roots.flatMap((root) => [...getKeptReads(root, queries)])),
  };
};

const withDeclaredReads = (checker: ts.TypeChecker, reads: DeclaredReads): ts.TypeChecker => ({
  ...checker,
  getTypeAtLocation: (node) => {
    const declared = reads.getDeclaredType(node);
    return declared === undefined || reads.keptReads.get(node) === true
      ? checker.getTypeAtLocation(node)
      : declared;
  },
});

export const createContext = (
  checker: ts.TypeChecker,
  files: readonly ts.SourceFile[],
  implicitGlobals: ReadonlySet<ts.Symbol>,
): Context => {
  const reads = getDeclaredReads(checker, files);
  return {
    checker: withDeclaredReads(checker, reads),
    keptReads: reads.keptReads,
    names: createNames(JAVASCRIPT_OPERATORS),
    variables: new Map(),
    definitions: new Map(),
    stateCalls: new Map(),
    inProgress: new Set(),
    recursive: new Set(),
    selfCalls: new Map(),
    sharedHelpers: new Map(),
    sharedCallbacks: new Map(),
    sharedCalls: new Map(),
    throwPlaces: [],
    thrownName: undefined,
    output: [],
    links: [],
    modelValues: new Map(),
    constructors: new Map(),
    prelude: new Set(),
    unknowns: undefined,
    heap: undefined,
    builtIns: new Set(),
    isAccessorRead: false,
    isSourceTextRead: false,
    constantFunctions: new Map(),
    functionObjects: new Map(),
    hasSpecialNumbers: false,
    hasOrderedCollections: false,
    isEveryMapHeld: true,
    script: undefined,
    reached: undefined,
    symbols: [],
    fractions: new Map(),
    doubles: new Set(),
    heapCollections: new Set(),
    storedBuiltIns: new Map(),
    closures: new Map(),
    onceLocals: new Set(),
    onceFunctions: new Set(),
    guardedStatements: findGuardedStatements(files),
    functionCandidates: new Map(),
    collectionProxies: new Set(),
    checkedGlobals: new Set(),
    implicitGlobals,
    generatorPrototypes: new Map(),
    namespaces: new Map(),
    templateSites: [],
    hasInheritedElements: false,
    characters: new Set(),
    longLiterals: new Set(),
    regExps: [],
    passed: new Map(),
    changeSummaries: new Map(),
    effects: new Map(),
    assignedNames: new Map(
      files.map((file) => [
        file,
        new Set(
          findNodes(file, (node): node is ts.Node => getAssignedTarget(node) !== undefined).flatMap(
            (node) =>
              getWrittenNames(getAssignedTarget(node) ?? node).flatMap((name) =>
                ts.isIdentifier(name) ? (getSymbol(name, checker) ?? []) : [],
              ),
          ),
        ),
      ]),
    ),
    objectArguments: new Map(
      files.map((file) => [
        file,
        new Set(
          findNodes(file, ts.isCallExpression).flatMap((call) =>
            call.arguments.flatMap((argument) => {
              const symbol = getSymbol(skipCasts(argument), checker);
              return symbol !== undefined && isObjectArgument(argument, checker) ? [symbol] : [];
            }),
          ),
        ),
      ]),
    ),
    escapedNames: new Map(
      files.map((file) => [
        file,
        new Set(
          findNodes(file, ts.isIdentifier).flatMap((name) =>
            ts.isShorthandPropertyAssignment(name.parent)
              ? (checker.getShorthandAssignmentValueSymbol(name.parent) ?? [])
              : (ts.isReturnStatement(name.parent) && name.parent.expression === name) ||
                  (ts.isArrowFunction(name.parent) && name.parent.body === name) ||
                  (ts.isPropertyAssignment(name.parent) &&
                    name.parent.initializer === name &&
                    ts.isObjectLiteralExpression(name.parent.parent))
                ? (getSymbol(name, checker) ?? [])
                : [],
          ),
        ),
      ]),
    ),
  };
};

// Whether a node writes an object or a regexp literal, each of which makes an object.
export const hasObjectLiteral = (node: ts.Node): boolean =>
  ts.isObjectLiteralExpression(node) ||
  ts.isRegularExpressionLiteral(node) ||
  (ts.forEachChild(node, hasObjectLiteral) ?? false);

// The function whose arguments object a reference to arguments names. tla-ts follows only a
// reference that no arrow function holds, since an arrow function names the arguments of the
// function around it, which a later call may have replaced.
const isModuleSyntax = (statement: ts.Statement) =>
  ts.isImportDeclaration(statement) ||
  ts.isImportEqualsDeclaration(statement) ||
  ts.isExportDeclaration(statement) ||
  ts.isExportAssignment(statement) ||
  (ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ));

// An await that no function encloses.
const hasTopLevelAwait = (node: ts.Node): boolean =>
  ts.isAwaitExpression(node) ||
  (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasTopLevelAwait) ?? false));

// A file that imports, exports, or awaits outside a function, which Node runs only as a module.
// Node runs another file as a script where it strips its types, and a CommonJS module's code in a
// function.
export const isModuleFile = (file: ts.SourceFile) =>
  !isCommonJsFile(file.fileName) &&
  (file.statements.some(isModuleSyntax) || hasTopLevelAwait(file));

// A "use strict" directive is in the string literals that start the statements, and later it is
// only an expression.
const hasStrictDirective = (statements: readonly ts.Statement[]) => {
  const isString = (statement: ts.Statement) =>
    ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
  const end = statements.findIndex((statement) => !isString(statement));
  return statements
    .slice(0, end === -1 ? statements.length : end)
    .some(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        statement.expression.getText().slice(1, -1) === "use strict",
    );
};

// Code that runs in strict mode wherever it runs: in a class, under a "use strict" directive, or in
// a module.
export const isStrictCode = (node: ts.Node): boolean =>
  ts.findAncestor(
    node,
    (ancestor) =>
      ts.isClassLike(ancestor) ||
      (ts.isFunctionLike(ancestor) &&
        "body" in ancestor &&
        ancestor.body !== undefined &&
        ts.isBlock(ancestor.body) &&
        hasStrictDirective(ancestor.body.statements)) ||
      (ts.isSourceFile(ancestor) &&
        (hasStrictDirective(ancestor.statements) || isModuleFile(ancestor))),
  ) !== undefined;

// The body of the function, or the script, whose vars a node's code declares.
export const getVarScope = (node: ts.Node) => {
  const owner = ts.findAncestor(
    node.parent,
    (ancestor) => ts.isFunctionLike(ancestor) || ts.isSourceFile(ancestor),
  );
  return owner === undefined || ts.isSourceFile(owner)
    ? owner
    : "body" in owner && owner.body !== undefined && ts.isBlock(owner.body)
      ? owner.body
      : undefined;
};

// Whether a var of a name in place of a function that a block declares would be an early error
// where a node around it declares the name: as a lexical declaration of a block, a case block, a
// function's body, or a script, as a loop's lexical declaration, or in a catch's pattern. As in
// Node, another function that a block declares there isn't one.
const isVarConflict = (node: ts.Node, name: string) => {
  const statements =
    ts.isBlock(node) || ts.isSourceFile(node)
      ? node.statements
      : ts.isCaseBlock(node)
        ? node.clauses.flatMap((clause) => [...clause.statements])
        : undefined;
  if (statements !== undefined) {
    return getLexicalNames(
      statements.filter(
        (statement) => !(ts.isFunctionDeclaration(statement) && isPlain(statement)),
      ),
      ts.isSourceFile(node) || ts.isFunctionLike(node.parent),
    ).includes(name);
  }
  const declarations =
    (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
    node.initializer !== undefined &&
    ts.isVariableDeclarationList(node.initializer) &&
    (node.initializer.flags & ts.NodeFlags.BlockScoped) !== 0
      ? node.initializer.declarations
      : ts.isCatchClause(node) &&
          node.variableDeclaration !== undefined &&
          !ts.isIdentifier(node.variableDeclaration.name)
        ? [node.variableDeclaration]
        : [];
  return declarations.some((declaration) => getBindingNames(declaration.name).includes(name));
};

// A function that a block, a case, or an if's branch declares outside strict mode, which as Annex
// B.3.2 and B.3.3 add also assigns a var of its name in its function or its script, unless such a
// var in its place would be an early error or names a parameter. A function's arguments object takes the name arguments as a
// parameter does, but in an arrow or beside a function declaration of that name.
export const isVarFunction = (
  node: ts.Node,
): node is ts.FunctionDeclaration & { name: ts.Identifier } => {
  if (
    !ts.isFunctionDeclaration(node) ||
    node.name === undefined ||
    node.body === undefined ||
    !isPlain(node) ||
    isStrictCode(node)
  ) {
    return false;
  }
  const parent = node.parent;
  const scope = getVarScope(node);
  if (
    scope === undefined ||
    !(
      ts.isCaseClause(parent) ||
      ts.isDefaultClause(parent) ||
      ts.isIfStatement(parent) ||
      (ts.isBlock(parent) && !ts.isFunctionLike(parent.parent))
    )
  ) {
    return false;
  }
  const name = node.name.text;
  const isConflict = (ancestor: ts.Node): boolean =>
    !ts.isFunctionLike(ancestor) &&
    (isVarConflict(ancestor, name) ||
      (ancestor.parent !== undefined && isConflict(ancestor.parent)));
  if (isConflict(parent)) return false;
  const owner = scope.parent;
  if (ts.isSourceFile(scope) || !ts.isFunctionLike(owner)) return true;
  const isArgumentsObject =
    !ts.isArrowFunction(owner) &&
    !scope.statements.some(
      (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "arguments",
    );
  return (
    !owner.parameters.some((parameter) => getBindingNames(parameter.name).includes(name)) &&
    !(name === "arguments" && isArgumentsObject)
  );
};

// The name of the var that a function that isVarFunction finds assigns: one that a var declaration
// of its function or its script binds, or else a function declaration there.
export const getVarFunctionTarget = (node: ts.FunctionDeclaration & { name: ts.Identifier }) => {
  const scope = getVarScope(node);
  if (scope === undefined) return undefined;
  const name = node.name.text;
  const declared = scope.statements.flatMap((statement) =>
    findNodes(statement, (inner): inner is ts.Identifier => {
      if (
        !ts.isIdentifier(inner) ||
        inner.text !== name ||
        !(ts.isVariableDeclaration(inner.parent) || ts.isBindingElement(inner.parent)) ||
        inner.parent.name !== inner
      ) {
        return false;
      }
      const holder = ts.findAncestor(
        inner.parent,
        (ancestor) =>
          ts.isVariableDeclarationList(ancestor) ||
          ts.isCatchClause(ancestor) ||
          ts.isParameter(ancestor) ||
          ts.isFunctionLike(ancestor),
      );
      return (
        holder !== undefined &&
        ts.isVariableDeclarationList(holder) &&
        (holder.flags & ts.NodeFlags.BlockScoped) === 0 &&
        getVarScope(holder) === scope
      );
    }),
  );
  return (
    declared.at(0) ??
    scope.statements
      .filter(ts.isFunctionDeclaration)
      .find((statement) => statement.name?.text === name)?.name
  );
};

// The function whose arguments object a name reads, which for an arrow is the function around it.
export const getArgumentsOwner = (node: ts.Node, checker: ts.TypeChecker) => {
  if (!ts.isIdentifier(node) || node.text !== "arguments") return undefined;
  const symbol = checker.getSymbolAtLocation(node);
  const owner = ts.findAncestor(
    node.parent,
    (ancestor): ancestor is FunctionNode =>
      ts.isFunctionDeclaration(ancestor) ||
      ts.isFunctionExpression(ancestor) ||
      ts.isMethodDeclaration(ancestor) ||
      ts.isConstructorDeclaration(ancestor) ||
      ts.isAccessor(ancestor),
  );
  return symbol === undefined || symbol.declarations !== undefined ? undefined : owner;
};

// A name that no declaration binds, whose reading throws a ReferenceError, but for a global that
// Node gives.
export const isUnresolved = (node: ts.Node, context: Context): node is ts.Identifier =>
  ts.isIdentifier(node) &&
  context.checker.getSymbolAtLocation(node) === undefined &&
  !NODE_GLOBALS.has(node.text);

// The names that an assignment target writes, through the elements of its patterns.
const getAssignedNames = (target: ts.Expression): ts.Expression[] => {
  const inner = skipCasts(target);
  if (ts.isArrayLiteralExpression(inner)) return inner.elements.flatMap(getAssignedNames);
  if (ts.isObjectLiteralExpression(inner)) {
    return inner.properties.flatMap((property) =>
      ts.isPropertyAssignment(property)
        ? getAssignedNames(property.initializer)
        : ts.isShorthandPropertyAssignment(property)
          ? [property.name]
          : ts.isSpreadAssignment(property)
            ? getAssignedNames(property.expression)
            : [],
    );
  }
  if (ts.isSpreadElement(inner)) return getAssignedNames(inner.expression);
  if (ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return getAssignedNames(inner.left);
  }
  return [inner];
};

// The names that a node writes without reading them first: an assignment's, through the elements
// of its patterns, and a for-in's or a for-of's.
const getPlainWrites = (node: ts.Node): ts.Expression[] =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ? getAssignedNames(node.left)
    : (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
        !ts.isVariableDeclarationList(node.initializer)
      ? getAssignedNames(node.initializer)
      : [];

// Whether a name is one that an assignment or a for-in or a for-of writes without reading it.
export const isPlainWrite = (name: ts.Identifier) =>
  ts.findAncestor(name.parent, (ancestor) =>
    ts.isFunctionLike(ancestor) ? "quit" : getPlainWrites(ancestor).includes(name),
  ) !== undefined;

// Outside strict mode, a write to a name that no binding has makes a global: the names that a
// file's code writes so. arguments is TypeScript's own name, which a declaration can't bind, and a
// host may give the global object others, which exist before the write.
export const getImplicitGlobals = (
  file: ts.SourceFile,
  getNameSymbol: (name: ts.Identifier) => ts.Symbol | undefined,
) =>
  new Set(
    findNodes(file, (node): node is ts.Node => getPlainWrites(node).length > 0)
      .flatMap(getPlainWrites)
      .filter(
        (name): name is ts.Identifier =>
          ts.isIdentifier(name) &&
          ![...HOST_GLOBAL_KEYS, "arguments"].includes(name.text) &&
          !isStrictCode(name) &&
          getNameSymbol(name) === undefined,
      )
      .map((name) => name.text),
  );

// Outside strict mode, a write to NaN, Infinity, or undefined does nothing, which tla-ts doesn't
// follow. In strict mode, a write to a global that a write outside it makes throws a ReferenceError
// where the global doesn't exist yet, which tla-ts doesn't follow either.
export const rejectSloppyGlobalWrites = (file: ts.SourceFile, context: Context) => {
  const isFixedGlobal = (name: ts.Expression) =>
    ts.isIdentifier(name) &&
    ["NaN", "Infinity", "undefined"].includes(name.text) &&
    (getSymbol(name, context.checker)?.declarations ?? []).every(
      (declaration) => declaration.getSourceFile().isDeclarationFile,
    );
  const getWrites = (node: ts.Node): ts.Expression[] => {
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      return kind >= ts.SyntaxKind.FirstCompoundAssignment && kind <= ts.SyntaxKind.LastAssignment
        ? [skipCasts(node.left)].filter(isFixedGlobal)
        : getPlainWrites(node);
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      return [skipCasts(node.operand)].filter(isFixedGlobal);
    }
    return getPlainWrites(node);
  };
  const writes = findNodes(file, (node): node is ts.Node => getWrites(node).length > 0).flatMap(
    getWrites,
  );
  const written = writes.find(
    (name) =>
      ts.isIdentifier(name) &&
      !isStrictCode(name) &&
      (getSymbol(name, context.checker) === undefined || isFixedGlobal(name)),
  );
  if (written !== undefined) {
    throw new TlaTypeScriptError("tla-ts can't write a global outside strict mode", written);
  }
  const strictWrite = writes.find((name) => isStrictCode(name) && isImplicitGlobal(name, context));
  if (strictWrite !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't write in strict mode a global that a write outside it makes",
      strictWrite,
    );
  }
};

// Whether a name reads a global that a write outside strict mode makes, which throws a
// ReferenceError until the write runs.
export const isImplicitGlobal = (name: ts.Node, context: Context): name is ts.Identifier => {
  const symbol = ts.isIdentifier(name) ? getSymbol(name, context.checker) : undefined;
  return symbol !== undefined && context.implicitGlobals.has(symbol);
};

// Outside strict mode, a var named arguments that a function declares starts as the function's
// arguments object (ECMA-262 §10.2.11), which tla-ts doesn't give it, so a read of the var stops
// unless a statement of the function's body that assigns the var ran first.
export const rejectArgumentsVarReads = (file: ts.SourceFile, context: Context) => {
  const read = findNodes(
    file,
    (node): node is ts.Identifier => ts.isIdentifier(node) && node.text === "arguments",
  ).find((name) => {
    const parent = name.parent;
    if (
      ((ts.isVariableDeclaration(parent) || ts.isBindingElement(parent)) && parent.name === name) ||
      isPlainWrite(name)
    ) {
      return false;
    }
    const declaration = (
      ts.isShorthandPropertyAssignment(parent)
        ? context.checker.getShorthandAssignmentValueSymbol(parent)
        : getSymbol(name, context.checker)
    )?.valueDeclaration;
    const scope =
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.isVariableDeclarationList(declaration.parent) &&
      (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0
        ? getVarScope(declaration)
        : undefined;
    if (scope === undefined || !ts.isBlock(scope) || ts.isArrowFunction(scope.parent)) {
      return false;
    }
    const assignment = scope.statements.find(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (inner) =>
            ts.isIdentifier(inner.name) &&
            inner.name.text === "arguments" &&
            inner.initializer !== undefined,
        ),
    );
    return assignment === undefined || name.pos < assignment.end;
  });
  if (read !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a function's var named arguments before the function assigns it",
      read,
    );
  }
};

// Whether a literal is truthy, where its value is certain.
const getLiteralTruth = (node: ts.Expression) => {
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) {
    return false;
  }
  if (ts.isStringLiteral(node)) return node.text !== "";
  const value = ts.isNumericLiteral(node) ? Number(node.text) : Number.NaN;
  return Number.isNaN(value) ? undefined : value !== 0;
};

// Whether a condition is truthy where it only reads literals and the typeof of names that nothing
// declares, which is "undefined", as a guard of a global that a host may give does.
export const getStaticTruth = (node: ts.Expression, context: Context): boolean | undefined => {
  const inner = skipCasts(node);
  if (inner.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (inner.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(inner) && inner.operator === ts.SyntaxKind.ExclamationToken) {
    const operand = getStaticTruth(inner.operand, context);
    return operand === undefined ? undefined : !operand;
  }
  if (!ts.isBinaryExpression(inner)) return undefined;
  const kind = inner.operatorToken.kind;
  if (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken) {
    const left = getStaticTruth(inner.left, context);
    return left === undefined || left === (kind === ts.SyntaxKind.BarBarToken)
      ? left
      : getStaticTruth(inner.right, context);
  }
  const isUndeclaredTypeOf = (side: ts.Expression) => {
    const operand = skipCasts(side);
    return ts.isTypeOfExpression(operand) && isUnresolved(skipCasts(operand.expression), context);
  };
  const text = [inner.left, inner.right]
    .map(skipCasts)
    .find((side): side is ts.StringLiteral => ts.isStringLiteral(side))?.text;
  if (text === undefined || ![inner.left, inner.right].some(isUndeclaredTypeOf)) return undefined;
  return kind === ts.SyntaxKind.EqualsEqualsEqualsToken || kind === ts.SyntaxKind.EqualsEqualsToken
    ? text === "undefined"
    : kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        kind === ts.SyntaxKind.ExclamationEqualsToken
      ? text !== "undefined"
      : undefined;
};

// The name that an expression reads before it evaluates anything that could change state or throw,
// whose reading throws a ReferenceError there: one that no declaration binds, or that isThrowing
// tells, such as a let before its declaration runs.
export const getUnresolvedRead = (
  node: ts.Expression | ts.ClassDeclaration,
  context: Context,
  isThrowing = (name: ts.Identifier) => isUnresolved(name, context),
): ts.Identifier | undefined => {
  if (ts.isIdentifier(node)) return isThrowing(node) ? node : undefined;
  // Reads each operand in order while the ones before it are literals.
  const readInOrder = (operands: readonly ts.Expression[]): ts.Identifier | undefined => {
    const first = operands.at(0);
    if (first === undefined) return undefined;
    // A spread reads its expression before it runs the iterator, which may run anything.
    if (ts.isSpreadElement(first)) return getUnresolvedRead(first.expression, context, isThrowing);
    const read = getUnresolvedRead(first, context, isThrowing);
    if (read !== undefined || getLiteralTruth(first) === undefined) return read;
    return readInOrder(operands.slice(1));
  };
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    return getUnresolvedRead(node.expression, context, isThrowing);
  }
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return getUnresolvedRead(node.operand, context, isThrowing);
  }
  // A yield evaluates its operand before it yields.
  if (ts.isYieldExpression(node)) {
    return node.expression === undefined
      ? undefined
      : getUnresolvedRead(node.expression, context, isThrowing);
  }
  // delete of a name doesn't read it, and typeof of one reads only a binding that declares it,
  // which throws before its declaration runs, but of a property they read the object first.
  if (ts.isDeleteExpression(node) || ts.isTypeOfExpression(node)) {
    const operand = skipCasts(node.expression);
    return ts.isIdentifier(operand)
      ? ts.isTypeOfExpression(node) && !isUnresolved(operand, context) && isThrowing(operand)
        ? operand
        : undefined
      : getUnresolvedRead(node.expression, context, isThrowing);
  }
  if (ts.isConditionalExpression(node)) {
    const truth = getLiteralTruth(node.condition);
    return truth === undefined
      ? getUnresolvedRead(node.condition, context, isThrowing)
      : getUnresolvedRead(truth ? node.whenTrue : node.whenFalse, context, isThrowing);
  }
  if (ts.isArrayLiteralExpression(node)) return readInOrder(node.elements);
  // An object literal evaluates its values and spreads in order, and a spread reads its
  // expression before it copies anything.
  if (ts.isObjectLiteralExpression(node)) {
    const values = node.properties.map((property) =>
      ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name)
        ? [property.initializer]
        : ts.isShorthandPropertyAssignment(property)
          ? [property.name]
          : ts.isSpreadAssignment(property)
            ? [property.expression]
            : [],
    );
    const end = values.findIndex((value) => value.length === 0);
    return readInOrder(values.slice(0, end === -1 ? undefined : end).flat());
  }
  // A class without a base evaluates its computed keys in order before it runs anything else.
  if (ts.isClassLike(node)) {
    if (node.heritageClauses !== undefined) return undefined;
    return readInOrder(
      node.members.flatMap((member) =>
        member.name !== undefined && ts.isComputedPropertyName(member.name)
          ? [member.name.expression]
          : [],
      ),
    );
  }
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    if (ts.isIdentifier(node.expression) && isThrowing(node.expression)) return node.expression;
    // A function declaration binds its name before any code runs, so reading it can't throw, and
    // a class declaration that comes before binds its name, or reading it throws a ReferenceError
    // too. A new evaluates its arguments before the class runs any code, and a function written
    // in place, or super, evaluates nothing that can throw before them, and nor does a method of a
    // name that no getter or proxy can answer.
    const callee = skipCasts(node.expression);
    const declaration = ts.isIdentifier(callee)
      ? context.checker.getSymbolAtLocation(callee)?.valueDeclaration
      : undefined;
    if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
      if (isThrowing(callee.expression)) return callee.expression;
      return getGetterKeys(node).has(callee.name.text) || isProxyOperation(callee, context)
        ? undefined
        : readInOrder(node.arguments ?? []);
    }
    return ts.isFunctionExpression(callee) ||
      callee.kind === ts.SyntaxKind.SuperKeyword ||
      (declaration !== undefined &&
        (ts.isFunctionDeclaration(declaration) ||
          (ts.isClassDeclaration(declaration) && declaration.end <= node.getStart())))
      ? readInOrder(node.arguments ?? [])
      : undefined;
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const operator = node.operatorToken.kind;
  // An assignment to a name reads its value only after it evaluates the value it assigns, and one
  // to a property reads the object first.
  if (operator === ts.SyntaxKind.EqualsToken) {
    return ts.isIdentifier(node.left)
      ? getUnresolvedRead(node.right, context, isThrowing)
      : ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left)
        ? getUnresolvedRead(node.left.expression, context, isThrowing)
        : (getUnresolvedRead(node.right, context, isThrowing) ??
          getPatternRead(node.left, node.right, context, isThrowing));
  }
  const truth = getLiteralTruth(node.left);
  const isShortCircuit =
    (operator === ts.SyntaxKind.AmpersandAmpersandToken && truth === false) ||
    (operator === ts.SyntaxKind.BarBarToken && truth === true) ||
    (operator === ts.SyntaxKind.QuestionQuestionToken &&
      node.left.kind !== ts.SyntaxKind.NullKeyword &&
      truth !== undefined);
  return isShortCircuit ? undefined : readInOrder([node.left, node.right]);
};

// The name whose read or write throws a ReferenceError first as an assignment pattern
// destructures a literal: the first element's default, where the literal lacks that element, or
// else the name the element writes.
export const getPatternRead = (
  pattern: ts.Expression,
  value: ts.Expression,
  context: Context,
  isThrowing: (name: ts.Identifier) => boolean,
): ts.Identifier | undefined => {
  const part = !isInertValue(value)
    ? undefined
    : ts.isArrayLiteralExpression(pattern) && ts.isArrayLiteralExpression(value)
      ? getArrayPatternPart(pattern, value)
      : ts.isObjectLiteralExpression(pattern) && ts.isObjectLiteralExpression(value)
        ? getObjectPatternPart(pattern, value)
        : undefined;
  if (part === undefined || !ts.isIdentifier(part.target)) return undefined;
  const initializer = part.isPresent ? undefined : part.initializer;
  return initializer === undefined
    ? isThrowing(part.target)
      ? part.target
      : undefined
    : (getUnresolvedRead(initializer, context, isThrowing) ??
        (isInertValue(initializer) && isThrowing(part.target) ? part.target : undefined));
};

interface PatternPart {
  target: ts.Expression;
  initializer: ts.Expression | undefined;
  isPresent: boolean;
}

// The first element of an array pattern, which an empty literal or a rest element leaves its
// iterator done for, so that a throw doesn't close it.
const getArrayPatternPart = (
  pattern: ts.ArrayLiteralExpression,
  value: ts.ArrayLiteralExpression,
): PatternPart | undefined => {
  const first = pattern.elements.at(0);
  return first === undefined
    ? undefined
    : ts.isSpreadElement(first)
      ? { target: first.expression, initializer: undefined, isPresent: true }
      : value.elements.length > 0
        ? undefined
        : ts.isBinaryExpression(first) && first.operatorToken.kind === ts.SyntaxKind.EqualsToken
          ? { target: first.left, initializer: first.right, isPresent: false }
          : { target: first, initializer: undefined, isPresent: false };
};

const getObjectPatternPart = (
  pattern: ts.ObjectLiteralExpression,
  value: ts.ObjectLiteralExpression,
): PatternPart | undefined => {
  const getKey = (name: ts.PropertyName) =>
    ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
  const first = pattern.properties.at(0);
  const key =
    first !== undefined &&
    (ts.isShorthandPropertyAssignment(first) || ts.isPropertyAssignment(first))
      ? getKey(first.name)
      : undefined;
  // An inert literal holds only property assignments. Its __proto__ gives it another prototype,
  // and a property whose value may be undefined takes the default.
  const properties = value.properties.filter(ts.isPropertyAssignment);
  const matching = properties.filter((innerProperty) => getKey(innerProperty.name) === key);
  if (
    first === undefined ||
    key === undefined ||
    properties.some((innerProperty) =>
      [undefined, "__proto__"].includes(getKey(innerProperty.name)),
    ) ||
    matching.some(
      (innerProperty) =>
        ts.isIdentifier(innerProperty.initializer) ||
        ts.isVoidExpression(innerProperty.initializer),
    )
  ) {
    return undefined;
  }
  const isPresent = matching.length > 0;
  return ts.isShorthandPropertyAssignment(first)
    ? { target: first.name, initializer: first.objectAssignmentInitializer, isPresent }
    : ts.isPropertyAssignment(first) &&
        ts.isBinaryExpression(first.initializer) &&
        first.initializer.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? { target: first.initializer.left, initializer: first.initializer.right, isPresent }
      : ts.isPropertyAssignment(first)
        ? { target: first.initializer, initializer: undefined, isPresent }
        : undefined;
};

// TypeScript gives new.target the symbol of the function it's in, which isn't its value.
// The catch parameter that a var in its block declares again, which the var's initializer and a
// for-in's or for-of's steps write, as Annex B.3.4 has it, while the var's own binding stays
// undefined.
export const getRedeclaredCatchParameter = (declaration: ts.VariableDeclaration) => {
  if (
    !ts.isIdentifier(declaration.name) ||
    !ts.isVariableDeclarationList(declaration.parent) ||
    (declaration.parent.flags & ts.NodeFlags.BlockScoped) !== 0
  ) {
    return undefined;
  }
  const name = declaration.name.text;
  const clause = ts.findAncestor(declaration.parent, (ancestor) =>
    ts.isFunctionLike(ancestor) || ts.isClassStaticBlockDeclaration(ancestor)
      ? "quit"
      : ts.isCatchClause(ancestor) &&
        ancestor.variableDeclaration !== undefined &&
        ts.isIdentifier(ancestor.variableDeclaration.name) &&
        ancestor.variableDeclaration.name.text === name,
  );
  return clause !== undefined && ts.isCatchClause(clause)
    ? clause.variableDeclaration?.name
    : undefined;
};

// The symbol that a name binds or reads, where a var that declares a catch parameter again binds
// the parameter.
export const getSymbol = (node: ts.Node, checker: ts.TypeChecker) => {
  const redeclared =
    ts.isIdentifier(node) && ts.isVariableDeclaration(node.parent) && node.parent.name === node
      ? getRedeclaredCatchParameter(node.parent)
      : undefined;
  return getOwnSymbol(redeclared ?? node, checker);
};

// The symbol of a name's own declaration, which a var that hoists its binding takes.
export const getOwnSymbol = (node: ts.Node, checker: ts.TypeChecker): ts.Symbol | undefined => {
  const parent = node.parent;
  // A parameter property's name names the property, where the constructor's body reads the
  // parameter.
  const symbol = ts.isMetaProperty(node)
    ? undefined
    : ts.isShorthandPropertyAssignment(parent) && parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(parent)
      : ts.isIdentifier(node) &&
          ts.isParameter(parent) &&
          parent.name === node &&
          ts.isParameterPropertyDeclaration(parent, parent.parent)
        ? checker.getSymbolsOfParameterPropertyDeclaration(parent, node.text)[0]
        : (checker.getSymbolAtLocation(node) ?? getCastNamespaceMember(node, checker));
  return symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
};

// The export that a read of a module's namespace object through a cast names, as
// (ts as any).SyntaxKind names ts.SyntaxKind, where TypeScript types the read as any.
const getCastNamespaceMember = (node: ts.Node, checker: ts.TypeChecker) => {
  const parent = node.parent;
  const access = ts.isPropertyAccessExpression(node)
    ? node
    : parent !== undefined && ts.isPropertyAccessExpression(parent) && parent.name === node
      ? parent
      : undefined;
  if (access === undefined || !ts.isIdentifier(access.name)) return undefined;
  const receiver = skipCasts(access.expression);
  const module = receiver === access.expression ? undefined : getOwnSymbol(receiver, checker);
  return module?.valueDeclaration !== undefined && ts.isSourceFile(module.valueDeclaration)
    ? checker.getExportsOfModule(module).find((exported) => exported.name === access.name.text)
    : undefined;
};

// A name that only declarations type, as Node's typings type process, which has no code to run.
export const isDeclarationOnly = (symbol: ts.Symbol) => {
  const declarations = symbol.declarations ?? [];
  return (
    declarations.length > 0 &&
    declarations.every(
      (declaration) =>
        (declaration.getSourceFile().isDeclarationFile ||
          (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Ambient) !== 0) &&
        !declaration.getSourceFile().hasNoDefaultLib,
    )
  );
};

// A declaration that a script's declare, or a function's signature without a body, gives, of a
// value that the host defines.
const isHostDeclaration = (declaration: ts.Declaration) =>
  (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Ambient) !== 0 ||
  (ts.isFunctionDeclaration(declaration) && declaration.body === undefined);

// setTimeout(callback), which runs the callback once the jobs before it finish.
export const isTimerCall = (node: ts.CallExpression, context: Context) => {
  const declarations = getSymbol(node.expression, context.checker)?.declarations ?? [];
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === "setTimeout" &&
    declarations.every(
      (declaration) =>
        declaration.getSourceFile().isDeclarationFile || isHostDeclaration(declaration),
    )
  );
};

// The function that a with statement's rewrite declares, whose call stops the check where tla-ts
// can't follow what the statement's object binds.
export const WITH_STOP = "$tlaWithStop";

// The value that a delete outside strict mode leaves a global that a write makes, which reads throw
// for until a write makes it again.
export const DELETED_GLOBAL = "$tlaDeletedGlobal";

// A name that only a script's declare gives.
const isScriptDeclared = (node: ts.Expression, context: Context) => {
  const declarations = ts.isIdentifier(node)
    ? (getSymbol(node, context.checker)?.declarations ?? [])
    : [];
  return (
    declarations.length > 0 &&
    declarations.every(
      (declaration) =>
        !declaration.getSourceFile().isDeclarationFile && isHostDeclaration(declaration),
    )
  );
};

export const isDeletedGlobal = (node: ts.Identifier, context: Context) =>
  node.text === DELETED_GLOBAL && isScriptDeclared(node, context);

// The reason that a call of a with statement's stop gives.
export const getWithStop = (node: ts.CallExpression, context: Context) => {
  const reason = node.arguments.at(0);
  return ts.isIdentifier(node.expression) &&
    node.expression.text === WITH_STOP &&
    reason !== undefined &&
    ts.isStringLiteral(reason) &&
    isScriptDeclared(node.expression, context)
    ? reason.text
    : undefined;
};

// A call of a function that only a script's declarations give, other than setTimeout, runs code
// that tla-ts has no model of.
export const rejectDeclaredCall = (node: ts.CallExpression, context: Context) => {
  if (
    isScriptDeclared(node.expression, context) &&
    getWithStop(node, context) === undefined &&
    !isTimerCall(node, context)
  ) {
    throw new TlaTypeScriptError(`tla-ts can't call ${node.expression.getText()}`, node);
  }
};

export const isMethodCall = (node: ts.Node): node is MethodCall =>
  ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression);

// The array that a call of a function through apply passes, where the call binds the function's
// parameters to its elements, as CreateListFromArrayLike takes them, rather than to arguments that it
// writes.
export const getAppliedList = (argumentNodes: readonly ts.Expression[]) => {
  const list = argumentNodes.length === 1 ? argumentNodes[0] : undefined;
  const call = list?.parent;
  return call !== undefined &&
    isMethodCall(call) &&
    call.expression.name.text === "apply" &&
    call.arguments.length === 2 &&
    call.arguments[1] === list
    ? list
    : undefined;
};

export const isSuperAccess = (
  node: ts.Node,
): node is (ts.PropertyAccessExpression | ts.ElementAccessExpression) & {
  expression: ts.SuperExpression;
} =>
  (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
  node.expression.kind === ts.SyntaxKind.SuperKeyword;

const isTopLevel = (statement: ts.Node): boolean => {
  const parent = statement.parent;
  if (ts.isSourceFile(parent)) return true;
  const namespace = ts.isModuleBlock(parent) ? parent.parent : parent;
  return ts.isModuleDeclaration(namespace) && isTopLevel(namespace);
};

// The declaration of a constant or function at the top level of a module, which becomes a TLA+
// definition.
export const getTopLevelDeclaration = (symbol: ts.Symbol | undefined) => {
  const declaration = symbol?.valueDeclaration;
  if (declaration === undefined || declaration.getSourceFile().isDeclarationFile) return undefined;
  if (ts.isFunctionDeclaration(declaration) && isTopLevel(declaration)) return declaration;
  const isTopLevelConst =
    ts.isVariableDeclaration(declaration) &&
    ts.isVariableStatement(declaration.parent.parent) &&
    isTopLevel(declaration.parent.parent) &&
    (declaration.parent.flags & ts.NodeFlags.Const) !== 0;
  return isTopLevelConst ? declaration : undefined;
};

const isAsync = (node: FunctionNode) =>
  node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) === true;

export const isPlain = (node: FunctionNode) => node.asteriskToken === undefined && !isAsync(node);

export const isGenerator = (node: FunctionNode) =>
  node.asteriskToken !== undefined && !isAsync(node);

export const isAsyncFunction = (node: FunctionNode) =>
  node.asteriskToken === undefined && isAsync(node);

export const isAsyncGenerator = (node: FunctionNode) =>
  node.asteriskToken !== undefined && isAsync(node);

export const isAnyGenerator = (node: FunctionNode) => node.asteriskToken !== undefined;

export const getAnyFunction = (node: ts.Node | undefined): FunctionNode | undefined => {
  if (node === undefined) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return node;
  }
  return ts.isVariableDeclaration(node) ? getAnyFunction(node.initializer) : undefined;
};

// The function a node is, or that a variable declaration initializes.
export const getFunction = (node: ts.Node | undefined) => {
  const found = getAnyFunction(node);
  return found !== undefined && isPlain(found) ? found : undefined;
};

// A class whose definition and instances run no code, so only its methods matter.
const isInert = (node: ts.ClassLikeDeclaration) =>
  node.heritageClauses === undefined &&
  node.members.every(
    (member) =>
      ts.isSemicolonClassElement(member) ||
      ((ts.isMethodDeclaration(member) || ts.isAccessor(member)) &&
        !ts.isComputedPropertyName(member.name)),
  );

// The class a node names, from a class declaration or a variable that a class expression
// initializes.
export const getClass = (node: ts.Node | undefined, context: Context) => {
  const declaration =
    node === undefined ? undefined : getSymbol(node, context.checker)?.valueDeclaration;
  if (declaration === undefined) return undefined;
  const found = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration;
  return found !== undefined &&
    ts.isClassLike(found) &&
    isInert(found) &&
    !isHeapClass(found, context)
    ? found
    : undefined;
};

// Whether a variable's initializer is a function or a class, which tla-ts inlines where it's used
// instead of storing.
export const isInlined = (node: ts.Node | undefined, context: Context) => {
  const found = getAnyFunction(node);
  return (
    (found !== undefined &&
      !isHeapFunction(found, context) &&
      !isFunctionObject(found, context) &&
      !isClosure(found, context)) ||
    getFactoryCall(node, context) !== undefined ||
    (node !== undefined &&
      ts.isClassExpression(node) &&
      isInert(node) &&
      !isHeapClass(node, context))
  );
};

// The method that a getter like `get method() { return this.#method; }` returns.
const getReturnedMethod = (getter: ts.GetAccessorDeclaration, context: Context) => {
  const statement = getter.body?.statements.length === 1 ? getter.body.statements[0] : undefined;
  const returned =
    statement !== undefined && ts.isReturnStatement(statement) ? statement.expression : undefined;
  if (
    returned === undefined ||
    !ts.isPropertyAccessExpression(returned) ||
    returned.expression.kind !== ts.SyntaxKind.ThisKeyword
  ) {
    return undefined;
  }
  return getSymbol(returned.name, context.checker)?.valueDeclaration;
};

// A method whose class the call names exactly: a static method on the class, or a method on a
// new instance.
const getMethod = (node: ts.Expression, context: Context) => {
  if (!ts.isPropertyAccessExpression(node)) return undefined;
  const named = getSymbol(node.name, context.checker)?.valueDeclaration;
  const declaration =
    named !== undefined && ts.isGetAccessor(named) ? getReturnedMethod(named, context) : named;
  if (
    declaration === undefined ||
    named === undefined ||
    !ts.isMethodDeclaration(declaration) ||
    declaration.parent !== named.parent
  ) {
    return undefined;
  }
  const isStatic =
    ts.canHaveModifiers(named) &&
    ts.getModifiers(named)?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
  const receiver = node.expression;
  // A static method of a class of errors that makes plain errors, which reads no this, runs as a
  // function does.
  const errorClass = isStatic
    ? getErrorClass(getSymbol(receiver, context.checker), context)
    : undefined;
  if (
    errorClass?.[0].valueDeclaration === declaration.parent &&
    findNodes(
      declaration,
      (inner): inner is ts.Node =>
        inner.kind === ts.SyntaxKind.ThisKeyword || inner.kind === ts.SyntaxKind.SuperKeyword,
    ).length === 0
  ) {
    return declaration;
  }
  const owner = isStatic
    ? receiver
    : ts.isNewExpression(receiver) && (receiver.arguments ?? []).length === 0
      ? receiver.expression
      : undefined;
  return getClass(owner, context) === declaration.parent ? declaration : undefined;
};

// Whether code under a node runs at most once: outside functions and loops, or in the body of a
// function that a call runs where it's written, that its file calls at one place, or that a call
// passes to a function that calls it once. A for loop runs its initializer, and a for-of or a
// for-in the expression it iterates, once.
export const isOnce = (node: ts.Node, context: Context): boolean =>
  ts.isSourceFile(node) ||
  (ts.isFunctionLike(node)
    ? isCalledInPlace(node) || isCalledThroughCall(node)
      ? isOnce(node.parent, context)
      : isCalledOnce(node, context) || isPassedOnce(node, context)
    : !ts.isIterationStatement(node, false) &&
      (context.guardedStatements.has(node) ||
        ((ts.isForStatement(node.parent) && node.parent.initializer === node) ||
        ((ts.isForOfStatement(node.parent) || ts.isForInStatement(node.parent)) &&
          node.parent.expression === node)
          ? isOnce(node.parent.parent, context)
          : isOnce(node.parent, context))));

// The vars, parameters, and declared functions of each function in files that a call runs where
// it's written and whose body runs at most once, as an immediately invoked function's do.
export const findOnceFunctions = (files: readonly ts.SourceFile[], context: Context) =>
  files.flatMap((file) =>
    findNodes(
      file,
      (node): node is ts.FunctionExpression | ts.ArrowFunction =>
        (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
        isPlain(node) &&
        (isCalledInPlace(node) || isCalledThroughCall(node)) &&
        isOnce(node, context),
    ),
  );

export const findOnceLocals = (
  owners: readonly (ts.FunctionExpression | ts.ArrowFunction)[],
  checker: ts.TypeChecker,
) =>
  new Set(
    owners
      .flatMap((owner) => [
        ...owner.parameters.flatMap((parameter) =>
          ts.isIdentifier(parameter.name) ? [parameter.name] : [],
        ),
        ...findNodes(
          owner.body,
          (node): node is ts.Identifier =>
            ts.isIdentifier(node) &&
            ts.findAncestor(node.parent.parent, ts.isFunctionLike) === owner &&
            ((ts.isFunctionDeclaration(node.parent) && node.parent.name === node) ||
              (ts.isVariableDeclaration(node.parent) &&
                node.parent.name === node &&
                ts.isVariableDeclarationList(node.parent.parent) &&
                (node.parent.parent.flags & ts.NodeFlags.BlockScoped) === 0)),
        ),
      ])
      .flatMap((name) => getSymbol(name, checker) ?? []),
  );

// The statements of functions' bodies that follow a guard that returns where a variable of the file
// holds a value, and a statement that gives the variable an object, which nothing else writes: each
// runs at most once, however often its function runs, as a CommonJS module's loader runs the
// module. tla-ts finds them once before it compiles the code.
const findGuardedStatements = (files: readonly ts.SourceFile[]): ReadonlySet<ts.Node> =>
  new Set(
    files.flatMap((file) => {
      const writes = findNodes(
        file,
        (inner): inner is ts.BinaryExpression & { left: ts.Identifier } =>
          ts.isBinaryExpression(inner) &&
          inner.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          inner.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
          ts.isIdentifier(inner.left),
      );
      const getGuarded = (guard: ts.Statement) => {
        const condition = ts.isIfStatement(guard) ? guard.expression : undefined;
        const isReturning =
          ts.isIfStatement(guard) &&
          guard.elseStatement === undefined &&
          (ts.isReturnStatement(guard.thenStatement) ||
            (ts.isBlock(guard.thenStatement) &&
              guard.thenStatement.statements.length === 1 &&
              ts.isReturnStatement(guard.thenStatement.statements[0])));
        return isReturning &&
          condition !== undefined &&
          ts.isBinaryExpression(condition) &&
          condition.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
          ts.isIdentifier(condition.left) &&
          ts.isIdentifier(condition.right) &&
          condition.right.text === "undefined"
          ? condition.left.text
          : undefined;
      };
      const isFileVar = (name: string) => {
        const declarations = file.statements.flatMap((statement) =>
          ts.isVariableStatement(statement)
            ? statement.declarationList.declarations.filter(
                (declaration) =>
                  ts.isIdentifier(declaration.name) && declaration.name.text === name,
              )
            : [],
        );
        return declarations.length === 1 && declarations[0].initializer === undefined;
      };
      return findNodes(
        file,
        (node): node is ts.Block => ts.isBlock(node) && ts.isFunctionLike(node.parent),
      ).flatMap((body) =>
        body.statements.flatMap((guard, guardPosition) => {
          const name = getGuarded(guard);
          if (name === undefined || !isFileVar(name)) return [];
          const named = writes.filter((write) => write.left.text === name);
          const write = named.length === 1 ? named[0] : undefined;
          const statement = write?.parent;
          const position =
            statement !== undefined && ts.isExpressionStatement(statement)
              ? body.statements.indexOf(statement)
              : -1;
          return write === undefined ||
            write.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
            !ts.isObjectLiteralExpression(write.right) ||
            position <= guardPosition
            ? []
            : body.statements.slice(position + 1);
        }),
      );
    }),
  );

const calledOnce = new WeakMap<ts.Node, boolean>();

// A named function or method that its file calls at one place, which runs once, and names nowhere
// else, so that its body runs at most once.
const isCalledOnce = (node: ts.SignatureDeclaration, context: Context): boolean => {
  const known = calledOnce.get(node);
  if (known !== undefined) return known;
  // Functions that call each other answer no.
  calledOnce.set(node, false);
  const name =
    ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
      ? node.name
      : (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
          ts.isVariableDeclaration(node.parent) &&
          node.parent.initializer === node
        ? node.parent.name
        : undefined;
  const uses =
    name !== undefined && ts.isIdentifier(name)
      ? findNodes(
          node.getSourceFile(),
          (inner): inner is ts.Identifier =>
            ts.isIdentifier(inner) && inner.text === name.text && inner !== name,
        )
      : [];
  const use = uses.length === 1 ? uses[0] : undefined;
  const callee =
    use !== undefined && ts.isPropertyAccessExpression(use.parent) && use.parent.name === use
      ? use.parent
      : use;
  const call = callee?.parent;
  const isOnceCalled =
    callee !== undefined &&
    call !== undefined &&
    ts.isCallExpression(call) &&
    call.expression === callee &&
    ts.findAncestor(call, (ancestor) => ancestor === node) === undefined &&
    isOnce(node.parent, context) &&
    isOnce(call, context);
  calledOnce.set(node, isOnceCalled);
  return isOnceCalled;
};

// The one function that a name or a namespace's member names in its file, where nothing else
// declares that name.
const getPassedTo = (callee: ts.Expression) => {
  const getDeclarations = (root: ts.Node, name: string) =>
    findNodes(
      root,
      (inner): inner is ts.Identifier => ts.isIdentifier(inner) && inner.text === name,
    ).flatMap((inner) => {
      const parent = inner.parent;
      return (ts.isVariableDeclaration(parent) ||
        ts.isFunctionDeclaration(parent) ||
        ts.isClassDeclaration(parent) ||
        ts.isParameter(parent) ||
        ts.isBindingElement(parent) ||
        ts.isModuleDeclaration(parent) ||
        ts.isEnumDeclaration(parent) ||
        ts.isImportSpecifier(parent) ||
        ts.isImportClause(parent) ||
        ts.isNamespaceImport(parent)) &&
        parent.name === inner
        ? [parent]
        : [];
    });
  const getOnly = (declarations: ts.Node[]) => {
    const only = declarations.length === 1 ? declarations[0] : undefined;
    return only !== undefined && ts.isFunctionDeclaration(only) && only.body !== undefined
      ? only
      : undefined;
  };
  const sourceFile = callee.getSourceFile();
  if (ts.isIdentifier(callee)) return getOnly(getDeclarations(sourceFile, callee.text));
  if (!ts.isPropertyAccessExpression(callee) || !ts.isIdentifier(callee.expression)) {
    return undefined;
  }
  const name = callee.name.text;
  // A namespace may merge with a function of its name.
  const declarations = getDeclarations(sourceFile, callee.expression.text);
  return declarations.every(
    (declaration) => ts.isModuleDeclaration(declaration) || ts.isFunctionDeclaration(declaration),
  )
    ? getOnly(
        declarations.flatMap((declaration) =>
          ts.isModuleDeclaration(declaration) && declaration.body !== undefined
            ? getDeclarations(declaration.body, name)
            : [],
        ),
      )
    : undefined;
};

// A function that a call passes to a function that calls it at one place, outside loops and
// functions of its own, and names it nowhere else, so that it runs at most once where the call
// runs once. An async one isn't, as the methods it makes read its locals from the environment of
// its call, which only a function that may run more than once makes.
const isPassedOnce = (node: ts.SignatureDeclaration, context: Context) => {
  const call = node.parent;
  if (
    !(ts.isFunctionExpression(node) || ts.isArrowFunction(node)) ||
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) !== 0 ||
    !ts.isCallExpression(call) ||
    !call.arguments.includes(node) ||
    call.arguments.slice(0, call.arguments.indexOf(node)).some(ts.isSpreadElement) ||
    !isOnce(call, context)
  ) {
    return false;
  }
  const callee = getPassedTo(call.expression);
  const parameter = callee?.parameters.at(call.arguments.indexOf(node));
  if (
    callee === undefined ||
    parameter === undefined ||
    parameter.dotDotDotToken !== undefined ||
    !ts.isIdentifier(parameter.name)
  ) {
    return false;
  }
  const name = parameter.name.text;
  // The arguments object would alias the parameter.
  const uses = findNodes(
    callee,
    (inner): inner is ts.Identifier =>
      ts.isIdentifier(inner) && (inner.text === name || inner.text === "arguments"),
  ).filter((use) => use !== parameter.name);
  const use = uses.length === 1 ? uses[0] : undefined;
  return (
    use !== undefined &&
    ts.isCallExpression(use.parent) &&
    use.parent.expression === use &&
    ts.findAncestor(use.parent, (ancestor) =>
      ancestor === callee
        ? "quit"
        : ts.isFunctionLike(ancestor) || ts.isIterationStatement(ancestor, false),
    ) === undefined
  );
};

const isCalledInPlace = (node: ts.Node) => {
  const getOuter = (inner: ts.Node): ts.Node =>
    ts.isParenthesizedExpression(inner.parent) ? getOuter(inner.parent) : inner;
  const outer = getOuter(node);
  return (
    (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
    ts.isCallExpression(outer.parent) &&
    outer.parent.expression === outer
  );
};

// A function expression that its call method runs where it's written, as a CommonJS module's
// wrapper runs with its exports as this.
const isCalledThroughCall = (node: ts.Node) => {
  const getOuter = (inner: ts.Node): ts.Node =>
    ts.isParenthesizedExpression(inner.parent) ? getOuter(inner.parent) : inner;
  const access = getOuter(node).parent;
  return (
    ts.isFunctionExpression(node) &&
    ts.isPropertyAccessExpression(access) &&
    access.name.text === "call" &&
    ts.isCallExpression(access.parent) &&
    access.parent.expression === access
  );
};
const isMethodShape = (node: ts.Node): node is ts.MethodDeclaration =>
  ts.isMethodDeclaration(node) && node.body !== undefined;

export const isPrivateMember = (node: ts.Node) =>
  (ts.isClassElement(node) || ts.isAccessor(node)) &&
  node.name !== undefined &&
  ts.isPrivateIdentifier(node.name);

const isPlainMethod = (node: ts.Node): node is ts.MethodDeclaration =>
  isMethodShape(node) && !isPrivateMember(node);

// A private method, which no property holds, so only its class can call it.
const isPrivateMethod = (node: ts.Node): node is ts.MethodDeclaration =>
  isMethodShape(node) && isPrivateMember(node);

const brands = new WeakMap<ts.Node, string>();

const getBrand = (owner: ts.Node, context: Context) => {
  const brand =
    brands.get(owner) ??
    context.names.getFresh(
      ts.isClassLike(owner) && owner.name !== undefined ? owner.name.text : "Class",
    );
  brands.set(owner, brand);
  return brand;
};

// The private key that marks the object of a class that a field holds, which a new of the field
// checks, as a script could replace what the field holds.
export const getClassKey = (node: ts.ClassLikeDeclaration, context: Context) =>
  `${getBrand(node, context)} class`;

// The key that an object's private names hold a private field's value under, or that marks it
// with its class's private methods and accessors, apart for the class's static ones. Two classes
// can name private members alike.
export const getPrivateKey = (member: ts.ClassElement, context: Context) => {
  const brand = getBrand(member.parent, context);
  return ts.isPropertyDeclaration(member) && ts.isPrivateIdentifier(member.name)
    ? `${brand}${member.name.text}`
    : isStatic(member)
      ? `${brand} static`
      : brand;
};

const isLiteralKey = (node: ts.Node) =>
  ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

// A field whose computed key a class evaluates once, in order with its other keys, as the script
// defines it. Its object holds the key under a private name, for each new to define the field by.
export const isComputedField = (member: ts.PropertyDeclaration) =>
  ts.isComputedPropertyName(member.name) && !isLiteralKey(member.name.expression);

export const getFieldKey = (member: ts.PropertyDeclaration, context: Context) =>
  `${getBrand(member.parent, context)} key ${member.parent.members.indexOf(member)}`;

// An accessor with a body and a key that a property can have, which a computed name gives as it
// evaluates.
export const isPlainAccessor = (
  node: ts.Node,
): node is ts.GetAccessorDeclaration | ts.SetAccessorDeclaration =>
  (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) &&
  node.body !== undefined &&
  !ts.isBigIntLiteral(node.name);

// The key that obj.name, obj["name"], or obj[0] reads, as a property key.
export const getAccessKey = (node: ts.Expression) => {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (!ts.isElementAccessExpression(node)) return undefined;
  const key = node.argumentExpression;
  if (ts.isNumericLiteral(key)) return String(Number(key.text));
  return ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key) ? key.text : undefined;
};

// Whether tla-ts inlines an accessor: a plain one of a heap class, or of an object literal that a
// script makes once.
const isInlinedAccessor = (accessor: ts.Declaration, context: Context) =>
  isPlainAccessor(accessor) &&
  (ts.isObjectLiteralExpression(accessor.parent)
    ? isOnce(accessor.parent, context)
    : ts.isClassLike(accessor.parent) && isHeapClass(accessor.parent, context));

// The accessor of a heap class, or of an object literal that a script makes once, that a property
// access names, which the access checks the object still holds.
const getObjectAccessor = <T extends ts.GetAccessorDeclaration | ts.SetAccessorDeclaration>(
  node: ts.Expression,
  isKind: (declaration: ts.Declaration) => declaration is T,
  context: Context,
) => {
  if (
    context.heap === undefined ||
    getAccessKey(node) === undefined ||
    !(ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
  ) {
    return undefined;
  }
  const name = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
  // A spread or a rest copies an accessor's value into a property of its own, which TypeScript
  // declares with the accessor still. A union's property is neither.
  const symbol = getSymbol(name, context.checker);
  const accessor =
    symbol !== undefined &&
    ((symbol.flags & ts.SymbolFlags.Accessor) !== 0 ||
      context.checker.getTypeAtLocation(node.expression).isUnionOrIntersection())
      ? symbol.declarations?.find(isKind)
      : undefined;
  return accessor !== undefined && isInlinedAccessor(accessor, context) ? accessor : undefined;
};

export const getObjectGetter = (node: ts.Expression, context: Context) =>
  getObjectAccessor(node, ts.isGetAccessorDeclaration, context);

// The setter that an assignment such as obj.name = value, or this.#name += value, runs. A compound
// or logical assignment reads the property through the getter first, which tla-ts runs only for
// private names.
export const getAssignedSetter = (node: ts.Node, context: Context) => {
  if (!ts.isBinaryExpression(node)) return undefined;
  const kind = node.operatorToken.kind;
  const setter =
    kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment
      ? getObjectAccessor(node.left, ts.isSetAccessorDeclaration, context)
      : undefined;
  return kind === ts.SyntaxKind.EqualsToken || (setter !== undefined && isPrivateMember(setter))
    ? setter
    : undefined;
};

// A field that only types the instance, which JavaScript never defines.
export const isAmbient = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword);

export const isStatic = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);

// Whether a class declares a member that its objects or its prototype hold. A static method lives
// on the class alone, so a class of errors with only static methods still makes plain errors.
export const hasObjectMembers = (node: ts.ClassLikeDeclaration) =>
  node.members.some((member) => !(ts.isMethodDeclaration(member) && isStatic(member)));

// The names and properties that an assignment's target writes, alone or in a pattern.
const getWrittenNames = (target: ts.Node): ts.Expression[] => {
  if (
    ts.isIdentifier(target) ||
    ts.isPropertyAccessExpression(target) ||
    ts.isElementAccessExpression(target)
  ) {
    return [target];
  }
  if (ts.isParenthesizedExpression(target) || ts.isSpreadElement(target)) {
    return getWrittenNames(target.expression);
  }
  if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return getWrittenNames(target.left);
  }
  if (ts.isArrayLiteralExpression(target)) return target.elements.flatMap(getWrittenNames);
  if (!ts.isObjectLiteralExpression(target)) return [];
  return target.properties.flatMap((property) => getWrittenNames(getPropertyTarget(property)));
};

// Whether an assignment's target writes a name, alone or in a pattern.
export const isWrittenBy = (target: ts.Node, symbol: ts.Symbol, context: Context) =>
  getWrittenNames(target).some(
    (name) => ts.isIdentifier(name) && getSymbol(name, context.checker) === symbol,
  );

// What a property of an object pattern assigns.
const getPropertyTarget = (property: ts.ObjectLiteralElementLike) =>
  ts.isPropertyAssignment(property)
    ? property.initializer
    : ts.isShorthandPropertyAssignment(property)
      ? property.name
      : ts.isSpreadAssignment(property)
        ? property.expression
        : property;

// The name of the variable that an object literal initializes, where the script evaluates it once
// and never assigns the variable again, so the name gives the object.
export const getLiteralName = (node: ts.ObjectLiteralExpression, context: Context) => {
  const declaration = node.parent;
  const symbol =
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer === node &&
    ts.isIdentifier(declaration.name)
      ? getSymbol(declaration.name, context.checker)
      : undefined;
  return ts.isVariableDeclaration(declaration) &&
    ts.isIdentifier(declaration.name) &&
    symbol !== undefined &&
    isOnce(node, context) &&
    !isAssigned(symbol, node.getSourceFile(), context)
    ? declaration.name
    : undefined;
};

// The target that an assignment, an increment, or a for-in or for-of without a declaration writes,
// or the var that a function that a block declares assigns outside strict mode.
export const getAssignedTarget = (node: ts.Node) =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
  node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ? node.left
    : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
        (node.operator === ts.SyntaxKind.PlusPlusToken ||
          node.operator === ts.SyntaxKind.MinusMinusToken)
      ? node.operand
      : (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
          !ts.isVariableDeclarationList(node.initializer)
        ? node.initializer
        : isVarFunction(node)
          ? getVarFunctionTarget(node)
          : undefined;

// Whether a script assigns to a name anywhere in a node, which for a whole file its index tells.
export const isAssigned = (symbol: ts.Symbol, node: ts.Node, context: Context): boolean => {
  if (ts.isSourceFile(node)) return context.assignedNames.get(node)?.has(symbol) ?? false;
  const target = getAssignedTarget(node);
  return (
    (target !== undefined && isWrittenBy(target, symbol, context)) ||
    (ts.forEachChild(node, (child) => isAssigned(symbol, child, context) || undefined) ?? false)
  );
};

// Whether a script assigns to a name inside a function other than the one around a read of it,
// which TypeScript's narrowing at the read doesn't see.
export const isAssignedElsewhere = (symbol: ts.Symbol, read: ts.Node, context: Context) => {
  const around = ts.findAncestor(read, ts.isFunctionLike);
  return (
    findNodes(read.getSourceFile(), (inner): inner is ts.Node => {
      const target = getAssignedTarget(inner);
      return (
        target !== undefined &&
        isWrittenBy(target, symbol, context) &&
        ts.findAncestor(inner, ts.isFunctionLike) !== around
      );
    }).length > 0
  );
};

// Whether a variable that a script declares without a type or a value is assigned only as the
// rest of object patterns, so that it holds undefined or an object.
export const isRestOnly = (symbol: ts.Symbol, context: Context) => {
  const declaration = symbol.valueDeclaration;
  if (
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.type !== undefined ||
    declaration.initializer !== undefined
  ) {
    return false;
  }
  const targets = findNodes(declaration.getSourceFile(), (inner): inner is ts.Node => {
    const target = getAssignedTarget(inner);
    return target !== undefined && isWrittenBy(target, symbol, context);
  }).map(getAssignedTarget);
  return (
    targets.length > 0 &&
    targets.every((target) => {
      if (target === undefined || !ts.isObjectLiteralExpression(target)) return false;
      const rest = target.properties.at(-1);
      return (
        rest !== undefined &&
        ts.isSpreadAssignment(rest) &&
        ts.isIdentifier(rest.expression) &&
        getSymbol(rest.expression, context.checker) === symbol &&
        !target.properties
          .slice(0, -1)
          .some((property) => isWrittenBy(getPropertyTarget(property), symbol, context))
      );
    })
  );
};

// Whether a part of a literal belongs to the pattern that an assignment or a for-of writes, through
// the nested patterns and the defaults in it.
const isPatternPart = (node: ts.Node): boolean => {
  const parent = node.parent;
  const isDefaulted =
    ts.isBinaryExpression(parent) &&
    parent.left === node &&
    parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    (ts.isArrayLiteralExpression(parent.parent) || ts.isPropertyAssignment(parent.parent));
  return isDefaulted ||
    ts.isArrayLiteralExpression(parent) ||
    ts.isObjectLiteralExpression(parent) ||
    ts.isShorthandPropertyAssignment(parent) ||
    (ts.isPropertyAssignment(parent) && parent.initializer === node) ||
    ts.isSpreadElement(parent) ||
    ts.isSpreadAssignment(parent)
    ? isPatternPart(parent)
    : (ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node)) &&
        getAssignedTarget(parent) === node;
};

// The name whose default in an assignment's pattern a node gives, which runs only where the part
// that the name takes is undefined.
const getPatternDefaultTarget = (node: ts.Node) => {
  const parent = node.parent;
  const target =
    ts.isShorthandPropertyAssignment(parent) && parent.objectAssignmentInitializer === node
      ? parent.name
      : ts.isBinaryExpression(parent) &&
          parent.right === node &&
          parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isIdentifier(parent.left) &&
          (ts.isArrayLiteralExpression(parent.parent) || ts.isPropertyAssignment(parent.parent))
        ? parent.left
        : undefined;
  return target !== undefined && isPatternPart(target) ? target : undefined;
};

// Whether a value of a type lacks a part, as the type has no such property or element, or one that
// is only undefined.
const isMissingPart = (type: ts.Type | undefined, key: string, checker: ts.TypeChecker) => {
  if (type === undefined || (type.flags & ts.TypeFlags.Object) === 0) return false;
  const property = checker.getPropertyOfType(checker.getApparentType(type), key);
  const part =
    property === undefined
      ? checker.getIndexTypeOfType(
          type,
          /^\d+$/.test(key) ? ts.IndexKind.Number : ts.IndexKind.String,
        )
      : checker.getTypeOfSymbol(property);
  return (
    part === undefined ||
    (part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Never)) !== 0
  );
};

// The name of the property that a part of an object pattern reads.
const getPatternKey = (key: ts.PropertyName | ts.BindingName) =>
  ts.isIdentifier(key) || ts.isStringLiteral(key) || ts.isNumericLiteral(key)
    ? key.text
    : undefined;

// Whether a variable that a script declares without a type or a value is assigned only the
// functions and classes that a plain assignment makes, or that the defaults of a whole pattern
// make where the value that the pattern takes lacks the part, so that it holds undefined or an
// object. A pattern's binding that nothing assigns may take such a default too.
export const isMadeOnly = (symbol: ts.Symbol, context: Context) => {
  const checker = context.checker;
  const declaration = symbol.valueDeclaration;
  const isMadeValue = (node: ts.Expression | undefined) =>
    node !== undefined && isFunctionObject(getGivenValue(node), context);
  if (declaration !== undefined && ts.isBindingElement(declaration)) {
    const pattern = declaration.parent;
    const key = ts.isArrayBindingPattern(pattern)
      ? String(pattern.elements.indexOf(declaration))
      : getPatternKey(declaration.propertyName ?? declaration.name);
    return (
      key !== undefined &&
      declaration.dotDotDotToken === undefined &&
      isMadeValue(declaration.initializer) &&
      !isAssigned(symbol, declaration.getSourceFile(), context) &&
      isMissingPart(checker.getTypeAtLocation(pattern), key, checker)
    );
  }
  if (
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.type !== undefined ||
    declaration.initializer !== undefined
  ) {
    return false;
  }
  // Whether the value that a whole pattern takes lacks a part.
  const isMissing = (pattern: ts.Node, key: string | undefined) => {
    const parent = pattern.parent;
    const type = ts.isForOfStatement(parent)
      ? checker.getIndexTypeOfType(
          checker.getTypeAtLocation(parent.expression),
          ts.IndexKind.Number,
        )
      : ts.isBinaryExpression(parent) && parent.left === pattern && !isPatternPart(parent)
        ? checker.getTypeAtLocation(parent.right)
        : undefined;
    return key !== undefined && isMissingPart(type, key, checker);
  };
  const isMadeWrite = (name: ts.Expression) => {
    const parent = name.parent;
    if (ts.isShorthandPropertyAssignment(parent) && ts.isIdentifier(name)) {
      return isMadeValue(parent.objectAssignmentInitializer) && isMissing(parent.parent, name.text);
    }
    if (
      !ts.isBinaryExpression(parent) ||
      parent.left !== name ||
      parent.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
      !isMadeValue(parent.right)
    ) {
      return false;
    }
    const holder = parent.parent;
    if (ts.isArrayLiteralExpression(holder)) {
      return isMissing(holder, String(holder.elements.indexOf(parent)));
    }
    if (ts.isPropertyAssignment(holder)) {
      return isMissing(holder.parent, getPatternKey(holder.name));
    }
    return !isPatternPart(parent);
  };
  const written = findNodes(declaration.getSourceFile(), (inner): inner is ts.Node => {
    const target = getAssignedTarget(inner);
    return target !== undefined && isWrittenBy(target, symbol, context);
  }).flatMap((inner) =>
    getWrittenNames(getAssignedTarget(inner) ?? inner).filter(
      (name) => ts.isIdentifier(name) && getSymbol(name, checker) === symbol,
    ),
  );
  return written.length > 0 && written.every(isMadeWrite);
};

// The names that a function reads from the functions around it, through the functions it names,
// which a call of an enclosing function binds anew. A function that runs once that call returns
// keeps the bindings where the script made it, which tla-ts follows only if nothing assigns them.
export const getLocalCaptures = (node: FunctionNode, context: Context) => {
  const captured = new Set<ts.Symbol>();
  const visited = new Set<ts.Node>([node]);
  const visit = (current: ts.Node, owner: ts.Node) => {
    if (ts.isIdentifier(current)) {
      const symbol = getSymbol(current, context.checker);
      const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
      const isLocal =
        declaration !== undefined &&
        (ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isBindingElement(declaration) ||
          ts.isFunctionDeclaration(declaration) ||
          ts.isClassDeclaration(declaration)) &&
        ts.findAncestor(declaration, (ancestor) => ancestor === owner) === undefined &&
        ts.findAncestor(
          declaration.parent,
          (ancestor) => ts.isFunctionLike(ancestor) || ts.isClassStaticBlockDeclaration(ancestor),
        ) !== undefined;
      if (symbol !== undefined && declaration !== undefined && isLocal) {
        if (isAssigned(symbol, current.getSourceFile(), context)) {
          throw new TlaTypeScriptError(
            "tla-ts can't follow a function that runs later and reads a local that changes",
            current,
          );
        }
        captured.add(symbol);
        const named = getAnyFunction(declaration);
        if (named !== undefined && !visited.has(named)) {
          visited.add(named);
          visit(named, named);
        }
      }
    }
    ts.forEachChild(current, (child) => visit(child, owner));
  };
  visit(node, node);
  return captured;
};

// The function that a script evaluates once, which is a value with one identity, either as the
// expression or through a name that its declaration gives it and nothing assigns, such as the name
// that a function expression gives itself.
export const getFunctionValue = (
  node: ts.Node,
  context: Context,
): ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration | undefined => {
  if (context.heap === undefined) return undefined;
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  const isNamed =
    symbol !== undefined &&
    declaration !== undefined &&
    !isAssigned(symbol, node.getSourceFile(), context);
  const found =
    isNamed && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : isNamed &&
          (ts.isFunctionDeclaration(declaration) ||
            (ts.isFunctionExpression(declaration) && !isNestedFunction(declaration, context)))
        ? declaration
        : node;
  return found !== undefined &&
    (ts.isFunctionExpression(found) ||
      ts.isArrowFunction(found) ||
      (ts.isFunctionDeclaration(found) && found.body !== undefined)) &&
    isOnce(found.parent, context) &&
    !isHeapFunction(found, context) &&
    !isFunctionObject(found, context) &&
    !isClosure(found, context)
    ? found
    : undefined;
};

export interface Binding {
  target: ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration | ts.MethodDeclaration;
  // The method that bind reads from an object, which bind binds only where the object holds it.
  method: CalledMethod | undefined;
  receiver: ts.Expression | undefined;
  arguments: ts.Expression[];
  isSteady: boolean;
  isCall: boolean;
}

// A value that reads the same wherever a script reads it: a literal, or a name that nothing assigns
// and that holds its value by the time the node runs.
const isSteady = (value: ts.Expression, node: ts.Node, context: Context) => {
  if (
    ts.isLiteralExpression(value) ||
    value.getText() === "undefined" ||
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
      value.kind,
    )
  ) {
    return true;
  }
  const symbol = ts.isIdentifier(value) ? getSymbol(value, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  return (
    symbol !== undefined &&
    declaration !== undefined &&
    declaration.getSourceFile() === node.getSourceFile() &&
    (ts.isFunctionDeclaration(declaration) || declaration.end < node.getStart()) &&
    !isAssigned(symbol, node.getSourceFile(), context)
  );
};

// The function or function expression that a name holds, where nothing assigns the name.
const getNamedFunction = (node: ts.Expression, context: Context) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  const made =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration;
  return symbol !== undefined &&
    made !== undefined &&
    (ts.isFunctionExpression(made) || ts.isFunctionDeclaration(made)) &&
    !isAssigned(symbol, node.getSourceFile(), context)
    ? made
    : undefined;
};

// A call of bind, as f.bind(x, ...) or Function.prototype.bind.call(f, x, ...), and the values that
// it reads: the function, the receiver, and the arguments.
const getBindCall = (node: ts.Node) => {
  if (!isMethodCall(node)) return undefined;
  const callee = node.expression;
  const isCall =
    callee.name.text === "call" && callee.expression.getText() === "Function.prototype.bind";
  if (!isCall && callee.name.text !== "bind") return undefined;
  return { isCall, values: isCall ? [...node.arguments] : [callee.expression, ...node.arguments] };
};

// A call of Function.prototype.bind on a function that a script evaluates once, as f.bind(x, ...)
// or Function.prototype.bind.call(f, x, ...), or on a class's method, as c.method.bind(c). A call
// of the bound function reads its receiver and arguments again, so it needs them steady, and an
// empty object can only be bound.
export const getBinding = (node: ts.Node, context: Context): Binding | undefined => {
  const call = context.heap === undefined ? undefined : getBindCall(node);
  if (call === undefined) return undefined;
  const isCall = call.isCall;
  const values = call.values;
  // A function that the heap holds, as new constructs it, may be bound only for new, which reads
  // it by its name.
  const constructed = values[0] === undefined ? undefined : getNamedFunction(values[0], context);
  const bound =
    values[0] === undefined
      ? undefined
      : (getFunctionValue(values[0], context) ??
        (constructed !== undefined && isHeapFunction(constructed, context)
          ? constructed
          : undefined));
  const isConstructedOnly =
    bound !== undefined && bound === constructed && isHeapFunction(bound, context);
  const called =
    bound !== undefined || values[0] === undefined
      ? undefined
      : getCalledMethod(values[0], context, (inner) => isPlain(inner) || isAsyncFunction(inner));
  const method =
    called?.getter === undefined &&
    called?.method !== undefined &&
    ts.isMethodDeclaration(called.method)
      ? { ...called, method: called.method }
      : undefined;
  const target = bound ?? method?.method;
  // A function that bind reads where the script makes it is steady itself.
  const read =
    method === undefined
      ? values.filter((value) => value !== target)
      : [method.receiver, ...values.slice(1)];
  if (
    target === undefined ||
    (bound !== undefined &&
      ((!ts.isArrowFunction(bound) && bound.asteriskToken !== undefined) ||
        (ts.getCombinedModifierFlags(bound) & ts.ModifierFlags.Async) !== 0)) ||
    read.some(
      (value) =>
        !isSteady(value, node, context) &&
        !(ts.isObjectLiteralExpression(value) && value.properties.length === 0),
    )
  ) {
    return undefined;
  }
  return {
    target,
    method,
    receiver: values[1],
    arguments: values.slice(2),
    isSteady: !isConstructedOnly && read.every((value) => isSteady(value, node, context)),
    isCall,
  };
};

// The binding that a value is: a call of bind, or a name that one gives and nothing assigns.
export const getBound = (node: ts.Expression, context: Context) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  if (
    symbol === undefined ||
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer === undefined
  ) {
    return getBinding(skipCasts(node), context);
  }
  // Only a name that a binding initializes needs the scan for assignments.
  const binding = getBinding(skipCasts(declaration.initializer), context);
  return binding !== undefined && !isAssigned(symbol, node.getSourceFile(), context)
    ? binding
    : undefined;
};

const hasExtends = (node: ts.ClassLikeDeclaration) =>
  (node.heritageClauses ?? []).some((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);

// What a class extends.
export const getExtended = (node: ts.ClassLikeDeclaration) =>
  node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]
    ?.expression;

// A class that extends null, whose constructor has no this to give and can't call super.
export const isNullBased = (node: ts.ClassLikeDeclaration) =>
  getExtended(node)?.kind === ts.SyntaxKind.NullKeyword;

// Whether a script may set a class's prototype, which a derived class's constructor calls. A call of
// Object.setPrototypeOf or Reflect.setPrototypeOf, or a write of __proto__, may set it unless its
// target's type rules the class out and the target is a value that the script makes there, or a
// variable, function, or class whose initializers and writes each rule it out too. Any other use
// of those names may set any class's.
const isPrototypeSettable = (node: ts.ClassLikeDeclaration, context: Context) => {
  const symbol = node.name === undefined ? undefined : getSymbol(node.name, context.checker);
  if (symbol === undefined) return false;
  const constructorType = context.checker.getTypeOfSymbol(symbol);
  const traced = new Set<ts.Symbol>();
  const mayHold = (target: ts.Expression): boolean => {
    const held = skipCasts(target);
    const isTyped = [target, held].some((expression) => {
      const type = context.checker.getTypeAtLocation(expression);
      return (
        (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Instantiable)) !==
          0 || context.checker.isTypeAssignableTo(constructorType, type)
      );
    });
    const isMadeHere =
      ts.isObjectLiteralExpression(held) ||
      ts.isArrayLiteralExpression(held) ||
      ts.isFunctionExpression(held) ||
      ts.isArrowFunction(held) ||
      ts.isClassExpression(held) ||
      ts.isLiteralExpression(held) ||
      ts.isTemplateExpression(held) ||
      [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
        held.kind,
      );
    if (isTyped || isMadeHere) return isTyped;
    const heldSymbol = ts.isIdentifier(held) ? getSymbol(held, context.checker) : undefined;
    if (heldSymbol === undefined) return true;
    if (traced.has(heldSymbol)) return false;
    traced.add(heldSymbol);
    const declarations = heldSymbol.declarations ?? [];
    // A pattern or a for-of may bind any part of its value, and a parameter any argument.
    const isTraceable =
      declarations.length > 0 &&
      declarations.every(
        (declaration) =>
          (ts.isVariableDeclaration(declaration) &&
            ts.isIdentifier(declaration.name) &&
            !ts.isForOfStatement(declaration.parent.parent)) ||
          ts.isFunctionDeclaration(declaration) ||
          ts.isClassDeclaration(declaration),
      );
    return (
      !isTraceable ||
      declarations.some(
        (declaration) =>
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer !== undefined &&
          mayHold(declaration.initializer),
      ) ||
      findNodes(held.getSourceFile(), (inner): inner is ts.Node => {
        const written = getAssignedTarget(inner);
        return (
          written !== undefined &&
          (isWrittenBy(written, heldSymbol, context) ||
            (ts.isIdentifier(skipCasts(written)) &&
              getSymbol(skipCasts(written), context.checker) === heldSymbol))
        );
      }).some(
        (write) =>
          !ts.isBinaryExpression(write) ||
          !ts.isIdentifier(skipCasts(write.left)) ||
          mayHold(write.right),
      )
    );
  };
  const isSetting = (name: ts.Identifier | ts.StringLiteralLike) => {
    const parent = name.parent;
    if (name.text === "setPrototypeOf") {
      const call = parent.parent;
      const target = ts.isCallExpression(call) ? call.arguments.at(0) : undefined;
      return !(
        ts.isPropertyAccessExpression(parent) &&
        parent.name === name &&
        ["Object", "Reflect"].includes(parent.expression.getText()) &&
        ts.isCallExpression(call) &&
        call.expression === parent &&
        target !== undefined &&
        !mayHold(target)
      );
    }
    if (ts.isPropertyAccessExpression(parent) && parent.name === name) {
      return getAssignedTarget(parent.parent) === parent && mayHold(parent.expression);
    }
    // An object literal's __proto__ sets the prototype of the object it makes.
    return !(ts.isPropertyAssignment(parent) && parent.name === name);
  };
  return findNodes(
    node.getSourceFile(),
    (inner): inner is ts.Identifier | ts.StringLiteralLike =>
      (ts.isIdentifier(inner) || ts.isStringLiteralLike(inner)) &&
      (inner.text === "setPrototypeOf" || inner.text === "__proto__"),
  ).some(isSetting);
};

// The derived classes without a constructor, from a class through the ones that it extends, whose
// implicit super calls a prototype that a script may set.
export const getSettableSupers = (
  node: HeapClass | undefined,
  context: Context,
): ts.ClassLikeDeclaration[] =>
  node !== undefined &&
  ts.isClassLike(node) &&
  hasExtends(node) &&
  !node.members.some(ts.isConstructorDeclaration)
    ? [
        ...(isPrototypeSettable(node, context) ? [node] : []),
        ...getSettableSupers(getBaseClass(node, context), context),
      ]
    : [];

// A class that extends null, whose constructor never reads this or super, or that nothing
// constructs, as its constructor without a body throws. Its instance fields never initialize.
const isNullSafe = (node: ts.ClassLikeDeclaration, context: Context) => {
  const isFielded = node.members.some(
    (member) => ts.isPropertyDeclaration(member) && !isStatic(member) && !isAmbient(member),
  );
  if (!isNullBased(node) || isFielded) return false;
  const constructor = node.members.find(ts.isConstructorDeclaration);
  // Its this is never initialized, which tla-ts follows as the constructor runs.
  if (constructor?.body !== undefined) {
    return (
      findNodes(constructor, (inner): inner is ts.Node => inner.kind === ts.SyntaxKind.SuperKeyword)
        .length === 0
    );
  }
  const declared = ts.isClassExpression(node) ? node.parent : node;
  const name = ts.isVariableDeclaration(declared) ? declared.name : node.name;
  const symbol = name === undefined ? undefined : getSymbol(name, context.checker);
  return (
    constructor === undefined &&
    symbol !== undefined &&
    findNodes(node.getSourceFile(), ts.isIdentifier).every(
      (identifier) =>
        identifier === name ||
        getSymbol(identifier, context.checker) !== symbol ||
        !(ts.isNewExpression(identifier.parent) && identifier.parent.expression === identifier),
    )
  );
};

// The built-ins whose new makes their object with new.target's prototype, as tla-ts follows it.
const isNewTargetBase = (name: string): name is BufferName | "Date" | Collection =>
  isBufferName(name) || name === "Date" || isCollectionName(name);

// The built-in constructor that makes the instances of a class without a constructor, which
// extends it or extends a class that does. Its default constructor passes new's arguments on. A
// class that extends a native error is one where it has members or the script reads its
// prototype, as its errors are records otherwise, and its constructors may run, as super(...)
// gives the error its message and cause. A class that extends a buffer, a typed array, or Date
// itself, whose new makes the built-in's object with the class's prototype, adds only methods.
export const getBuiltInBase = (
  node: ts.ClassLikeDeclaration,
  context: Context,
):
  | "Object"
  | "Iterator"
  | "Boolean"
  | "Number"
  | "String"
  | `${string}Error`
  | BufferName
  | "Date"
  | Collection
  | undefined => {
  const hasConstructor = node.members.some(ts.isConstructorDeclaration);
  const heritage = node.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]?.expression;
  const name = heritage === undefined ? undefined : getBuiltIn(heritage, context);
  if (
    name === "Object" ||
    name === "Iterator" ||
    name === "Boolean" ||
    name === "Number" ||
    name === "String"
  ) {
    return hasConstructor ? undefined : name;
  }
  // A collection's subclass may add only static members, as the heap reads its instances as the
  // collection's.
  if (name !== undefined && isNewTargetBase(name)) {
    return node.members.some((member) =>
      isCollectionName(name)
        ? !isStatic(member)
        : ts.isConstructorDeclaration(member) ||
          (ts.isPropertyDeclaration(member) && !isStatic(member)) ||
          isPrivateMember(member),
    )
      ? undefined
      : name;
  }
  const symbol = node.name === undefined ? undefined : getSymbol(node.name, context.checker);
  if (
    name !== undefined &&
    isNativeErrorName(name) &&
    name !== "AggregateError" &&
    name !== "SuppressedError" &&
    symbol !== undefined &&
    (hasObjectMembers(node) || isPrototypeRead(symbol, context.checker))
  ) {
    return name;
  }
  const base = getBaseClass(node, context);
  const inherited = base === undefined ? undefined : getBuiltInBase(base, context);
  return inherited !== undefined &&
    !isNewTargetBase(inherited) &&
    (!hasConstructor || isNativeErrorName(inherited))
    ? inherited
    : undefined;
};

// An empty class that a class's extends clause makes, which the class makes its objects after.
export const isInlineBase = (node: ts.ClassLikeDeclaration): node is ts.ClassExpression =>
  ts.isClassExpression(node) &&
  ts.isExpressionWithTypeArguments(node.parent) &&
  node.heritageClauses === undefined &&
  node.members.length === 0;

// The class that a class extends, which the script defines before it or its extends clause makes.
export const getBaseClass = (node: ts.ClassLikeDeclaration, context: Context) => {
  const heritage = node.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]?.expression;
  if (heritage !== undefined && ts.isClassExpression(heritage)) {
    return isInlineBase(heritage) ? heritage : undefined;
  }
  const declaration =
    heritage === undefined || !ts.isIdentifier(heritage)
      ? undefined
      : getSymbol(heritage, context.checker)?.valueDeclaration;
  const found =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration !== undefined &&
          ts.isPropertyDeclaration(declaration) &&
          declaration.initializer !== undefined &&
          ts.isClassExpression(declaration.initializer) &&
          isOnceField(declaration.initializer, context)
        ? declaration.initializer
        : declaration;
  return found !== undefined && ts.isClassLike(found) && found.end < node.getStart()
    ? found
    : undefined;
};

// Whether an expression that runs before a derived constructor's super(...) changes nothing and
// can't read this, since tla-ts starts the classes' fields first.
const isBeforeThis = (node: ts.Node) =>
  findNodes(
    node,
    (inner): inner is ts.Node =>
      ts.isCallExpression(inner) ||
      ts.isNewExpression(inner) ||
      ts.isPrefixUnaryExpression(inner) ||
      ts.isPostfixUnaryExpression(inner) ||
      ts.isDeleteExpression(inner) ||
      (ts.isBinaryExpression(inner) &&
        inner.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        inner.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
      inner.kind === ts.SyntaxKind.ThisKeyword ||
      inner.kind === ts.SyntaxKind.SuperKeyword,
  ).length === 0;

// The super(...) that a derived class's constructor starts with, after parameters and before
// arguments that change nothing and can't read this.
export const getSuperCall = (constructor: ts.ConstructorDeclaration) => {
  const first = constructor.body?.statements[0];
  const call =
    first !== undefined && ts.isExpressionStatement(first) && ts.isCallExpression(first.expression)
      ? first.expression
      : undefined;
  return call !== undefined &&
    call.expression.kind === ts.SyntaxKind.SuperKeyword &&
    findNodes(
      constructor.body ?? constructor,
      (node): node is ts.CallExpression =>
        ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword,
    ).length === 1 &&
    constructor.parameters.every(isBeforeThis) &&
    call.arguments.every(isBeforeThis)
    ? call
    : undefined;
};

// Whether a class or one it extends gives an instance field a value that isn't a literal, which
// tla-ts gives as the new makes the instance.
const hasComputedFields = (node: ts.ClassLikeDeclaration | undefined, context: Context): boolean =>
  node !== undefined &&
  (node.members.some(
    (member) =>
      ts.isPropertyDeclaration(member) &&
      !isStatic(member) &&
      member.initializer !== undefined &&
      !isLiteral(member.initializer),
  ) ||
    hasComputedFields(getBaseClass(node, context), context));

// The super(...) calls of a derived constructor that doesn't start with one, each of which runs in
// the constructor's own body, before which its this is uninitialized. Its parameters can't read
// this, which their defaults would read first, and the classes it extends give their fields only
// literals, which tla-ts gives before the statements before super(...) run.
export const getDeferredSuperCalls = (constructor: ts.ConstructorDeclaration, context: Context) => {
  const calls = findNodes(
    constructor.body ?? constructor,
    (node): node is ts.CallExpression =>
      ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword,
  );
  return constructor.body !== undefined &&
    hasExtends(constructor.parent) &&
    !isNullBased(constructor.parent) &&
    getSuperCall(constructor) === undefined &&
    constructor.parameters.every(isBeforeThis) &&
    calls.every(
      (call) =>
        ts.findAncestor(call.parent, ts.isFunctionLike) === constructor &&
        // A loop runs its body from one path, which can't tell a later super(...) from the first.
        ts.findAncestor(call, (ancestor) =>
          ancestor === constructor ? "quit" : ts.isIterationStatement(ancestor, false),
        ) === undefined,
    ) &&
    !hasComputedFields(getBaseClass(constructor.parent, context), context)
    ? calls
    : undefined;
};

// A derived class whose constructor starts with super(...), so its instance needs only the fields
// of each class in order, or one whose this is uninitialized until a later super(...). A class that
// adds fields or private names to the instance needs bases that run no constructor, since a base's
// constructor would see them before they exist.
const isDerivedSafe = (
  node: ts.ClassLikeDeclaration,
  base: ts.ClassLikeDeclaration,
  context: Context,
) => {
  const constructor = node.members.find(ts.isConstructorDeclaration);
  // A constructor defines the fields with plain names once super(...) returns.
  const isAdding =
    node.members.some(
      (member) =>
        !isStatic(member) &&
        ((ts.isPropertyDeclaration(member) &&
          !isAmbient(member) &&
          (constructor === undefined || isPrivateMember(member))) ||
          (isPrivateMember(member) && !ts.isConstructorDeclaration(member))),
    ) ||
    (constructor?.parameters.some((parameter) =>
      ts.isParameterPropertyDeclaration(parameter, constructor),
    ) ??
      false);
  return (
    (constructor === undefined ||
      (constructor.body !== undefined && getSuperCall(constructor) !== undefined) ||
      getDeferredSuperCalls(constructor, context) !== undefined) &&
    (!isAdding || getRunConstructor(base, context) === undefined)
  );
};

const heapClasses = new WeakMap<ts.ClassLikeDeclaration, boolean>();

// A class that a script evaluates once into objects on the heap: a constructor object with the
// static methods, and its prototype with the other methods. Its name never changes, so a new or
// a method call can find the class it names.
// A class without static fields or blocks that an instance field of a class makes, where the
// script constructs that class at one place that runs once, and names the field only to construct
// what it holds, so that the class runs once.
export const isOnceField = (node: ts.ClassLikeDeclaration, context: Context) => {
  const field = node.parent;
  if (
    !ts.isClassExpression(node) ||
    !ts.isPropertyDeclaration(field) ||
    field.initializer !== node ||
    isStatic(field) ||
    !ts.isIdentifier(field.name) ||
    // Nothing runs the static elements of a class that a field makes.
    node.members.some(
      (member) =>
        ts.isClassStaticBlockDeclaration(member) ||
        (ts.isPropertyDeclaration(member) && isStatic(member)),
    )
  ) {
    return false;
  }
  const owner = field.parent;
  const ownerName =
    ts.isClassExpression(owner) && ts.isVariableDeclaration(owner.parent)
      ? owner.parent.name
      : owner.name;
  if (ownerName === undefined || !ts.isIdentifier(ownerName)) return false;
  const getUses = (name: ts.Identifier) =>
    findNodes(
      node.getSourceFile(),
      (inner): inner is ts.Identifier =>
        ts.isIdentifier(inner) &&
        inner.text === name.text &&
        inner !== name &&
        // A base class's name is a value, though TypeScript parses it as a type's.
        ts.findAncestor(
          inner,
          (ancestor) => ts.isTypeNode(ancestor) && !ts.isExpressionWithTypeArguments(ancestor),
        ) === undefined,
    );
  const ownerUses = getUses(ownerName);
  const construction = ownerUses.length === 1 ? ownerUses[0].parent : undefined;
  return (
    construction !== undefined &&
    ts.isNewExpression(construction) &&
    construction.expression === ownerUses[0] &&
    ts.findAncestor(construction, (ancestor) => ancestor === owner) === undefined &&
    isOnce(construction, context) &&
    getUses(field.name).every(
      (use) =>
        ts.isPropertyAccessExpression(use.parent) &&
        use.parent.name === use &&
        ts.isNewExpression(use.parent.parent) &&
        use.parent.parent.expression === use.parent,
    )
  );
};

export const isHeapClass = (node: ts.ClassLikeDeclaration, context: Context): boolean => {
  if (context.heap === undefined) return false;
  const known = heapClasses.get(node);
  if (known !== undefined) return known;
  const declared = ts.isClassExpression(node) ? node.parent : node;
  const isField = isOnceField(node, context);
  const nameNode =
    ts.isVariableDeclaration(declared) || (isField && ts.isPropertyDeclaration(declared))
      ? declared.name
      : node.name;
  const symbol =
    nameNode === undefined || !ts.isIdentifier(nameNode)
      ? undefined
      : getSymbol(nameNode, context.checker);
  const base = getBaseClass(node, context);
  const isHeap =
    (base === undefined
      ? !hasExtends(node) ||
        isNullSafe(node, context) ||
        getBuiltInBase(node, context) !== undefined
      : (isInlineBase(base) || isHeapClass(base, context)) &&
        !isNullBased(base) &&
        isDerivedSafe(node, base, context) &&
        (getBuiltInBase(base, context) === undefined ||
          getBuiltInBase(node, context) !== undefined)) &&
    (symbol !== undefined || getInPlaceNew(node) !== undefined) &&
    (ts.isClassDeclaration(node) ||
      ts.isVariableDeclaration(declared) ||
      isField ||
      getInPlaceNew(node) !== undefined) &&
    isOnce(node, context) &&
    node.members.every(
      (member) =>
        ts.isSemicolonClassElement(member) ||
        (ts.isConstructorDeclaration(member) && member.body !== undefined) ||
        isPlainMethod(member) ||
        isPrivateMethod(member) ||
        isPlainAccessor(member) ||
        ts.isClassStaticBlockDeclaration(member) ||
        (ts.isPropertyDeclaration(member) &&
          (ts.isIdentifier(member.name) ||
            ts.isPrivateIdentifier(member.name) ||
            isLiteralKey(member.name) ||
            // A new reads a computed key from the class's object, which its binding names.
            (ts.isComputedPropertyName(member.name) &&
              (isLiteralKey(member.name.expression) || (symbol !== undefined && !isField))))),
    ) &&
    (symbol === undefined || !isAssigned(symbol, node.getSourceFile(), context));
  heapClasses.set(node, isHeap);
  return isHeap;
};

// Why a class that no other translation takes isn't a heap class, where the reason is its place
// rather than its members or what it extends.
export const getClassStop = (node: ts.ClassLikeDeclaration, context: Context) => {
  if (context.heap === undefined) return undefined;
  if (!isOnce(node, context))
    return "tla-ts can't make a class in code that may run more than once";
  const declared = ts.isClassExpression(node) ? node.parent : node;
  if (
    ts.isClassExpression(node) &&
    !ts.isVariableDeclaration(declared) &&
    !ts.isPropertyDeclaration(declared) &&
    getInPlaceNew(node) === undefined
  ) {
    return "tla-ts can't make a class that no declaration holds";
  }
  const name = ts.isVariableDeclaration(declared) ? declared.name : node.name;
  const symbol =
    name !== undefined && ts.isIdentifier(name) ? getSymbol(name, context.checker) : undefined;
  return symbol !== undefined && isAssigned(symbol, node.getSourceFile(), context)
    ? "tla-ts can't make a class whose name the script assigns"
    : undefined;
};

// The parameters that a call passes values to, without the this parameter that only types this.
export const getParameters = (node: ts.SignatureDeclaration) =>
  node.parameters.filter(
    (parameter) => !ts.isIdentifier(parameter.name) || parameter.name.text !== "this",
  );

// A function or a class that a parameter's or a pattern's default makes each time it runs, which
// a script can't call, only read, as its binding names it. A class must make nothing but its
// methods, which are plain functions with plain names, so it has no base class, no accessors, and
// no static fields or blocks.
export const isFunctionObject = (
  node: ts.Node,
  context: Context,
): node is ts.ArrowFunction | ts.FunctionExpression | ts.ClassExpression =>
  context.heap !== undefined &&
  (ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    (ts.isClassExpression(node) &&
      node.heritageClauses === undefined &&
      node.members.every(
        (member) =>
          ts.isSemicolonClassElement(member) ||
          (ts.isConstructorDeclaration(member) && member.body !== undefined) ||
          (isPlainMethod(member) &&
            (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Async) === 0 &&
            (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) ||
          (ts.isPropertyDeclaration(member) && !isStatic(member) && ts.isIdentifier(member.name)),
      ))) &&
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0 &&
  (isDefault(node) ||
    (ts.isClassExpression(node) && isReadClass(node)) ||
    (ts.isFunctionExpression(node) && isOnce(node.parent, context) && isPropertyRead(node)) ||
    isPassedFunction(node, context));

// Whether a function is the object of a property's read, such as function* () {}.prototype, rather
// than of a method's call.
const isPropertyRead = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent)) return isPropertyRead(parent);
  return (
    ts.isPropertyAccessExpression(parent) &&
    parent.expression === node &&
    !(ts.isCallExpression(parent.parent) && parent.parent.expression === parent)
  );
};

// A function that a call passes as an object, or an arrow or a generator that a name holds which a
// call passes, that the script makes once. A plain function that a name holds is a heap function.
// One that call or apply passes as the receiver and that reads no local of the functions around it
// is an object of its own each time the script makes it.
const isPassedFunction = (node: ts.Node, context: Context) => {
  if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return false;
  if (isCallReceiver(node) && getOuterLocals(node, context).length === 0) return true;
  if (!isOnce(node.parent, context)) return false;
  if (isObjectArgument(node, context.checker)) return true;
  const declaration = node.parent;
  if (
    (ts.isFunctionExpression(node) && node.asteriskToken === undefined) ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer !== node ||
    !ts.isIdentifier(declaration.name)
  ) {
    return false;
  }
  const symbol = getSymbol(declaration.name, context.checker);
  const sourceFile = node.getSourceFile();
  return (
    symbol !== undefined &&
    !isAssigned(symbol, sourceFile, context) &&
    isPassedAsObject(symbol, sourceFile, context)
  );
};

// Whether a class expression is only read where it runs: the object of a property access, a
// call's argument, or the value of a logical assignment to a name.
const isReadClass = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent)) return isReadClass(parent);
  return (
    (ts.isPropertyAccessExpression(parent) && parent.expression === node) ||
    (ts.isCallExpression(parent) && parent.arguments.some((argument) => argument === node)) ||
    (ts.isBinaryExpression(parent) &&
      parent.right === node &&
      ts.isIdentifier(parent.left) &&
      (LOGICAL_ASSIGNMENTS.has(parent.operatorToken.kind) ||
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken)) ||
    (ts.isPropertyAssignment(parent) && parent.initializer === node) ||
    (ts.isShorthandPropertyAssignment(parent) && parent.objectAssignmentInitializer === node)
  );
};

const LOGICAL_ASSIGNMENTS = new Set([
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

export const getStackKind = (node: ts.Expression, context: Context) => {
  const name = context.checker.getTypeAtLocation(node).getSymbol()?.name;
  return name === "DisposableStack" || name === "AsyncDisposableStack" ? name : undefined;
};

// A function that a DisposableStack's adopt or defer takes, which the stack calls as it disposes.
const isDisposeCallback = (
  node: ts.Node,
  context: Context,
): node is ts.ArrowFunction | ts.FunctionExpression =>
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  ts.isCallExpression(node.parent) &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  getStackKind(node.parent.expression.expression, context) !== undefined &&
  (node.parent.expression.name.text === "adopt"
    ? node.parent.arguments.at(1)
    : node.parent.expression.name.text === "defer"
      ? node.parent.arguments.at(0)
      : undefined) === node;

// A this, a super, or a new.target, which an arrow reads from the function around it.
const isLexical = (inner: ts.Node): inner is ts.Node =>
  inner.kind === ts.SyntaxKind.ThisKeyword ||
  inner.kind === ts.SyntaxKind.SuperKeyword ||
  ts.isMetaProperty(inner);

// A function expression, an arrow, or a method that another function makes as the value of an
// object's property, a function expression that it returns, or a function that it passes to adopt
// or defer, each time it runs, which is an object of its own each time. It reads no name that the
// functions around it bind, nor an arrow their this or arguments, so it runs the same wherever
// tla-ts inlines it, or it's a closure, which runs only in the call that made it.
export const isNestedFunction = (
  node: ts.Node,
  context: Context,
): node is
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration =>
  context.heap !== undefined &&
  (((isPlainAccessor(node) || (ts.isMethodDeclaration(node) && node.body !== undefined)) &&
    ts.isObjectLiteralExpression(node.parent) &&
    !isOnce(node.parent, context)) ||
    ((ts.isFunctionExpression(node) ||
      (ts.isArrowFunction(node) &&
        findNodes(node, isLexical).length === 0 &&
        findNodes(node, ts.isIdentifier).every((name) => name.text !== "arguments"))) &&
      ts.isPropertyAssignment(node.parent) &&
      node.parent.initializer === node &&
      !isFunctionObject(node, context) &&
      getFunctionValue(node, context) === undefined) ||
    (ts.isFunctionExpression(node) &&
      ts.isReturnStatement(node.parent) &&
      node.parent.expression === node &&
      findNodes(node, ts.isIdentifier).every((name) => name.text !== "arguments")) ||
    (ts.isFunctionExpression(node) &&
      isPropertyWrite(node) &&
      !isHeapFunction(node, context) &&
      getFunctionValue(node, context) === undefined) ||
    (isDisposeCallback(node, context) && !isOnce(node.parent, context))) &&
  node.asteriskToken === undefined &&
  // Of async functions, only methods, dispose callbacks, and what an asyncDispose getter returns,
  // which await using calls.
  ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0 ||
    ts.isMethodDeclaration(node) ||
    (ts.isReturnStatement(node.parent) &&
      ts.isGetAccessorDeclaration(node.parent.parent.parent) &&
      ts.isComputedPropertyName(node.parent.parent.parent.name) &&
      node.parent.parent.parent.name.expression.getText() === "Symbol.asyncDispose") ||
    isDisposeCallback(node, context)) &&
  ts.findAncestor(node.parent, ts.isFunctionLike) !== undefined &&
  (getOuterLocals(node, context).length === 0 || getLiveMaker(node, context) !== undefined);

// A function that a statement writes to an object's property, as this.f = function () {} does.
const isPropertyWrite = (node: ts.Node) =>
  ts.isBinaryExpression(node.parent) &&
  node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
  node.parent.right === node &&
  ts.isPropertyAccessExpression(node.parent.left) &&
  ts.isExpressionStatement(node.parent.parent);

// The locals that a function reads from the functions around it, with the function that binds each.
const getOuterLocals = (node: ts.Node, context: Context) =>
  findNodes(node, ts.isIdentifier).flatMap((name) => {
    const symbol = getSymbol(name, context.checker);
    const declaration =
      symbol === undefined || context.onceLocals.has(symbol) ? undefined : symbol.valueDeclaration;
    const owner =
      declaration === undefined
        ? undefined
        : ts.findAncestor(declaration.parent, ts.isFunctionLike);
    return symbol !== undefined &&
      declaration !== undefined &&
      owner !== undefined &&
      (ts.isVariableDeclaration(declaration) ||
        ts.isParameter(declaration) ||
        ts.isBindingElement(declaration) ||
        ts.isFunctionDeclaration(declaration) ||
        ts.isClassDeclaration(declaration)) &&
      ts.findAncestor(declaration, (ancestor) => ancestor === node) === undefined
      ? [{ symbol, owner }]
      : [];
  });

export type Closure =
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration;

// The const whose object literal holds a closure as a property's value, which tla-ts makes before
// the closure, so that the closure's environment holds the object, which the property then holds.
export const getHolder = (node: ts.Node) => {
  const property = node.parent;
  const literal = property.parent;
  const declaration = ts.findAncestor(literal, ts.isVariableDeclaration);
  return ts.isPropertyAssignment(property) &&
    property.initializer === node &&
    (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
    ts.isObjectLiteralExpression(literal) &&
    declaration !== undefined &&
    ts.isIdentifier(declaration.name) &&
    declaration.initializer !== undefined &&
    skipCasts(declaration.initializer) === literal &&
    (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0
    ? { declaration, literal, key: property.name.text }
    : undefined;
};

// The name of the const that holds a function.
const getHeldName = (node: ts.Node) =>
  ts.isVariableDeclaration(node.parent) &&
  node.parent.initializer === node &&
  ts.isIdentifier(node.parent.name) &&
  (ts.getCombinedNodeFlags(node.parent) & ts.NodeFlags.Const) !== 0
    ? node.parent.name
    : undefined;

// A function that a function makes and that outlives the call that made it, which reads the locals
// of that call from its environment: one that the function assigns to a name declared outside it,
// an async one that it returns, or one that an object literal or a property assignment holds, a
// method or an accessor of an object literal, or one that it returns, itself or by the name of the
// const that holds it, that reads a local of the function. An arrow reads the this of the function around it, which the environment doesn't hold,
// and an async closure that awaits would resume after its call returns.
export const isClosure = (node: ts.Node, context: Context): node is Closure => {
  const isMember =
    ((ts.isMethodDeclaration(node) && node.body !== undefined) || isPlainAccessor(node)) &&
    ts.isObjectLiteralExpression(node.parent) &&
    !isOnce(node.parent, context);
  if (
    context.heap === undefined ||
    !(ts.isFunctionExpression(node) || ts.isArrowFunction(node) || isMember) ||
    (ts.isFunctionExpression(node) && node.name !== undefined) ||
    ((ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) &&
      node.asteriskToken !== undefined)
  ) {
    return false;
  }
  const isAsync = (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) !== 0;
  const isAwaiting = (inner: ts.Node): inner is ts.Node =>
    ts.isAwaitExpression(inner) ||
    (ts.isForOfStatement(inner) && inner.awaitModifier !== undefined);
  const maker = ts.findAncestor(node.parent, ts.isFunctionLike);
  if (
    maker === undefined ||
    (ts.isArrowFunction(node) && findNodes(node, isLexical).length > 0) ||
    (isAsync && findNodes(node, isAwaiting).length > 0)
  ) {
    return false;
  }
  // The locals of the functions around it, which bind them as the function that makes it runs.
  const isReadingLocals = () =>
    findNodes(node, ts.isIdentifier).some((name) => {
      const symbol = getSymbol(name, context.checker);
      const declaration =
        symbol === undefined || context.onceLocals.has(symbol)
          ? undefined
          : symbol.valueDeclaration;
      return (
        declaration !== undefined &&
        ts.findAncestor(declaration, (ancestor) => ancestor === node) === undefined &&
        ts.findAncestor(declaration.parent, ts.isFunctionLike) !== undefined
      );
    });
  // A method or an accessor of an object literal that runs more than once is an object of its own
  // each time, as a function expression that the literal holds is. Its super reads the literal,
  // which the environment doesn't hold. A live method runs only in the call that made it.
  if (isMember) {
    return (
      !isAsync &&
      getLiveMaker(node, context) === undefined &&
      findNodes(node, (inner): inner is ts.Node => inner.kind === ts.SyntaxKind.SuperKeyword)
        .length === 0 &&
      isReadingLocals()
    );
  }
  const assignment = node.parent;
  const isAssignment =
    ts.isBinaryExpression(assignment) &&
    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    assignment.right === node &&
    ts.isExpressionStatement(assignment.parent);
  if (
    (ts.isPropertyAssignment(assignment) &&
      assignment.initializer === node &&
      ts.isObjectLiteralExpression(assignment.parent)) ||
    (isAssignment && ts.isPropertyAccessExpression(assignment.left))
  ) {
    return isReadingLocals();
  }
  const isReturnOf = (value: ts.Node) =>
    (ts.isReturnStatement(value.parent) && value.parent.expression === value) ||
    (ts.isArrowFunction(value.parent) && value.parent.body === value);
  const held = getHeldName(node);
  const heldSymbol = held === undefined ? undefined : getSymbol(held, context.checker);
  // A const of the function holds it, and the function returns or an object literal holds the
  // const. A factory that declares only functions stands instead for the function it returns, where
  // a call passes it literals.
  const block = held?.parent.parent.parent.parent;
  const isFactory = () =>
    block !== undefined &&
    ts.isBlock(block) &&
    block.parent === maker &&
    block.statements
      .slice(0, -1)
      .every((statement) =>
        ts.isVariableStatement(statement)
          ? statement.declarationList.declarations.every(
              (declaration) => getAnyFunction(declaration) !== undefined,
            )
          : ts.isFunctionDeclaration(statement),
      );
  const isReturned =
    isReturnOf(node) ||
    (heldSymbol !== undefined &&
      (context.escapedNames.get(node.getSourceFile())?.has(heldSymbol) ?? false) &&
      !isFactory());
  const declaration =
    isAssignment && ts.isIdentifier(assignment.left)
      ? getSymbol(assignment.left, context.checker)?.valueDeclaration
      : undefined;
  return (
    (isAsync && ts.isReturnStatement(node.parent) && node.parent.expression === node) ||
    (isReturned && isReadingLocals()) ||
    (declaration !== undefined &&
      ts.findAncestor(declaration, (ancestor) => ancestor === maker) === undefined)
  );
};

// The function around an arrow closure whose arguments object the closure reads, which must be the
// function that makes it.
export const getCapturedArguments = (node: Closure, context: Context) => {
  const owners = new Set(
    findNodes(node, ts.isIdentifier).flatMap((name) => {
      const owner = getArgumentsOwner(name, context.checker);
      return owner === undefined || ts.findAncestor(owner, (ancestor) => ancestor === node)
        ? []
        : [owner];
    }),
  );
  const maker = ts.findAncestor(node.parent, ts.isFunctionLike);
  if ([...owners].some((owner) => owner !== maker)) {
    throw new TlaTypeScriptError(
      "tla-ts can't follow a function that outlives its call and reads this arguments object",
      node,
    );
  }
  return [...owners].at(0);
};

// The locals of the function that makes a closure that the closure reads, each once. tla-ts copies
// them to the closure's environment where the function makes it, so each must hold its value by
// then, and keep it.
export const getCaptures = (node: Closure, context: Context) => {
  const maker = ts.findAncestor(node.parent, ts.isFunctionLike);
  // A loop between a node and the function that makes the closure, which runs it again.
  const isRepeated = (inner: ts.Node) =>
    ts.findAncestor(inner, (ancestor) =>
      ancestor === maker ? "quit" : ts.isIterationStatement(ancestor, false),
    ) !== undefined;
  const getNamed = (name: ts.Identifier) =>
    ts.isShorthandPropertyAssignment(name.parent)
      ? context.checker.getShorthandAssignmentValueSymbol(name.parent)
      : getSymbol(name, context.checker);
  // The functions that consts of the maker hold and that the closure runs by name, which run inside
  // it with what they read.
  const runs = new Set<ts.Node>([node]);
  const pending: ts.Node[] = [node];
  while (pending.length > 0) {
    findNodes(pending.pop() ?? node, ts.isIdentifier).forEach((name) => {
      const declaration = getNamed(name)?.valueDeclaration;
      const run =
        declaration !== undefined &&
        ts.isVariableDeclaration(declaration) &&
        ts.findAncestor(declaration.parent, ts.isFunctionLike) === maker
          ? getAnyFunction(declaration.initializer)
          : undefined;
      if (
        run === undefined ||
        runs.has(run) ||
        getHeldName(run) === undefined ||
        isClosure(run, context)
      ) {
        return;
      }
      runs.add(run);
      pending.push(run);
    });
  }
  const isRun = (inner: ts.Node) =>
    ts.findAncestor(inner, (ancestor) => runs.has(ancestor)) !== undefined;
  const captures = [...runs]
    .flatMap((run) => findNodes(run, ts.isIdentifier))
    .flatMap((name) => {
      const symbol = getNamed(name);
      const declaration = symbol?.valueDeclaration;
      return symbol !== undefined &&
        declaration !== undefined &&
        !context.onceLocals.has(symbol) &&
        !isRun(declaration) &&
        !(
          ts.isVariableDeclaration(declaration) && runs.has(declaration.initializer ?? declaration)
        ) &&
        ts.findAncestor(declaration.parent, ts.isFunctionLike) !== undefined &&
        (ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isBindingElement(declaration) ||
          ts.isFunctionDeclaration(declaration) ||
          ts.isFunctionExpression(declaration) ||
          ts.isClassLike(declaration))
        ? [{ name, symbol, declaration }]
        : [];
    });
  captures.forEach((capture) => {
    const declaration = capture.declaration;
    // A local that closures share holds its value in an environment of its own, which the
    // closure's environment holds.
    if (getSharedDeclaration(capture.symbol, context) !== undefined) return;
    // A local that changes lives in the environment once the closure is made, so nothing but the
    // closure may name it after that.
    if (
      isAssigned(capture.symbol, node.getSourceFile(), context) &&
      maker !== undefined &&
      !findNodes(maker, ts.isIdentifier).every(
        (name) =>
          (ts.isShorthandPropertyAssignment(name.parent)
            ? context.checker.getShorthandAssignmentValueSymbol(name.parent)
            : getSymbol(name, context.checker)) !== capture.symbol ||
          ts.findAncestor(name, (ancestor) => ancestor === node) !== undefined ||
          (name.end <= node.getStart() &&
            ts.findAncestor(name.parent, ts.isFunctionLike) === maker),
      )
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't follow a function that outlives its call and shares a local that changes",
        capture.name,
      );
    }
    // A local of a function around the maker holds the value it had as the maker ran, which the
    // environment copies where nothing assigns it, and where it's a let, a const, or a parameter,
    // which the maker can't read before it holds its value.
    const owner = ts.findAncestor(declaration.parent, ts.isFunctionLike);
    if (
      !(ts.isVariableDeclaration(declaration) || ts.isParameter(declaration)) ||
      !ts.isIdentifier(declaration.name) ||
      isRepeated(node) ||
      (owner === maker
        ? ts.isVariableDeclaration(declaration) &&
          (isRepeated(declaration) ||
            (declaration.end > node.getStart() && getHolder(node)?.declaration !== declaration))
        : isAssigned(capture.symbol, node.getSourceFile(), context) ||
          (ts.isVariableDeclaration(declaration) &&
            (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.BlockScoped) === 0))
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't follow a function that outlives its call and reads this name",
        capture.name,
      );
    }
  });
  return [...new Set(captures.map((capture) => capture.symbol))];
};

// The declaration of a local that a function shares with the closures it makes, which the
// function or another closure names after a closure that reads it is made, or that a closure that
// a function inside it makes reads. An environment of its own holds it from where its declaration
// runs, which each reads and writes. A let, or a var of the function's body, that a statement of
// its own declares.
export const getSharedDeclaration = (symbol: ts.Symbol, context: Context) => {
  const declaration = symbol.valueDeclaration;
  // A module's namespace object has its source file as its declaration, which has no parent.
  const statement =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.parent.parent
      : undefined;
  const owner = declaration && ts.findAncestor(declaration.parent, ts.isFunctionLike);
  if (
    context.heap === undefined ||
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    !ts.isIdentifier(declaration.name) ||
    statement === undefined ||
    !ts.isVariableStatement(statement) ||
    statement.declarationList.declarations.length !== 1 ||
    symbol.declarations?.length !== 1 ||
    owner === undefined ||
    (ts.getCombinedModifierFlags(owner) & ts.ModifierFlags.Async) !== 0 ||
    ((ts.isFunctionDeclaration(owner) ||
      ts.isFunctionExpression(owner) ||
      ts.isMethodDeclaration(owner)) &&
      owner.asteriskToken !== undefined) ||
    ((ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.BlockScoped) === 0 &&
      !(ts.isBlock(statement.parent) && statement.parent.parent === owner)) ||
    !isAssigned(symbol, declaration.getSourceFile(), context)
  ) {
    return undefined;
  }
  const names = findNodes(
    owner,
    (inner): inner is ts.Identifier =>
      ts.isIdentifier(inner) &&
      inner.text === symbol.name &&
      (ts.isShorthandPropertyAssignment(inner.parent)
        ? context.checker.getShorthandAssignmentValueSymbol(inner.parent)
        : getSymbol(inner, context.checker)) === symbol,
  );
  const isShared = names.some((name) => {
    const closure = ts.findAncestor(name.parent, (ancestor) =>
      ancestor === owner ? "quit" : isClosure(ancestor, context),
    );
    return (
      closure !== undefined &&
      (ts.findAncestor(closure.parent, ts.isFunctionLike) !== owner ||
        names.some(
          (other) =>
            ts.findAncestor(other, (ancestor) => ancestor === closure) === undefined &&
            (other.end > closure.getStart() ||
              ts.findAncestor(other.parent, ts.isFunctionLike) !== owner),
        ))
    );
  });
  return isShared ? declaration : undefined;
};

// The local that closures share that a statement declares, which makes its environment.
export const getSharedWrite = (statement: ts.Statement, context: Context) => {
  const declarations = ts.isVariableStatement(statement)
    ? statement.declarationList.declarations
    : undefined;
  const name = declarations?.length === 1 ? declarations[0].name : undefined;
  const symbol = name && ts.isIdentifier(name) ? getSymbol(name, context.checker) : undefined;
  const declaration = symbol && getSharedDeclaration(symbol, context);
  return symbol === undefined || declaration === undefined ? undefined : { symbol, declaration };
};

// The async function around a function that binds each local the function reads from outside it.
const getAsyncOwner = (node: ts.Node, context: Context) => {
  const enclosing = ts.findAncestor(node.parent, ts.isFunctionLike);
  const locals = getOuterLocals(node, context);
  return enclosing !== undefined &&
    (ts.isFunctionDeclaration(enclosing) ||
      ts.isFunctionExpression(enclosing) ||
      ts.isArrowFunction(enclosing) ||
      ts.isMethodDeclaration(enclosing)) &&
    isAsyncFunction(enclosing) &&
    locals.length > 0 &&
    locals.every((local) => local.owner === enclosing)
    ? enclosing
    : undefined;
};

// The async function whose locals a method of an object literal that it makes, or a function that
// it passes to adopt or defer, reads. Each call of the function makes the method anew, a closure
// that holds the call's environment, which runs only where that call runs, and reads the locals
// that the call binds there, unlike a closure that outlives its call.
export const getLiveMaker = (node: ts.Node, context: Context) =>
  ((ts.isMethodDeclaration(node) && ts.isObjectLiteralExpression(node.parent)) ||
    isDisposeCallback(node, context)) &&
  !isOnce(node.parent, context) &&
  node.asteriskToken === undefined
    ? getAsyncOwner(node, context)
    : undefined;

// The async function whose locals a function inside it reads from the one call that made it: the
// call whose environment a live method holds, the only call of a function that runs once, or the
// call that calls a function it declares by name.
export const getKeptMaker = (node: ts.Node, context: Context) => {
  const owner = getAsyncOwner(node, context);
  const declared = ts.isFunctionDeclaration(node) ? node.name : undefined;
  const symbol = declared === undefined ? undefined : getSymbol(declared, context.checker);
  return (
    getLiveMaker(node, context) ??
    (owner !== undefined &&
    (isOnce(owner, context) ||
      (symbol !== undefined &&
        findNodes(owner, ts.isIdentifier)
          .filter((name) => name !== declared && getSymbol(name, context.checker) === symbol)
          .every(
            (name) =>
              ts.isCallExpression(name.parent) &&
              name.parent.expression === name &&
              ts.findAncestor(name.parent, ts.isFunctionLike) === owner,
          )))
      ? owner
      : undefined)
  );
};

// The locals of an async function that functions inside it read, each with the key of its value in
// the environment of a call, which holds them while a body that runs later may read or change them.
export const getKeptLocals = (maker: ts.Node, context: Context) =>
  [
    ...new Set(
      findNodes(
        maker,
        (node): node is ts.SignatureDeclaration => node !== maker && ts.isFunctionLike(node),
      ).flatMap((inner) =>
        getOuterLocals(inner, context).flatMap((local) =>
          local.owner === maker ? [local.symbol] : [],
        ),
      ),
    ),
  ].map((symbol, position, locals) => ({
    symbol,
    key: locals.slice(0, position).some((other) => other.name === symbol.name)
      ? `${symbol.name}#${position}`
      : symbol.name,
  }));

// Whether a node gives a named binding's default, through parentheses and the commas that end in it.
const isDefault = (node: ts.Node): boolean =>
  ts.isParenthesizedExpression(node.parent) ||
  (ts.isBinaryExpression(node.parent) &&
    node.parent.operatorToken.kind === ts.SyntaxKind.CommaToken &&
    node.parent.right === node)
    ? isDefault(node.parent)
    : ((ts.isBindingElement(node.parent) || ts.isParameter(node.parent)) &&
        node.parent.initializer === node &&
        ts.isIdentifier(node.parent.name)) ||
      getPatternDefaultTarget(node) !== undefined;

export type HeapFunction = ts.FunctionDeclaration | ts.FunctionExpression;

// A function that a descriptor gives as its get or set, which an object literal may write as a
// method.
export type AccessorFunction = HeapFunction | ts.MethodDeclaration;

export type HeapClass = ts.ClassLikeDeclaration | HeapFunction;

const heapFunctions = new WeakMap<ts.Node, boolean>();

export const skipCasts = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) ||
  ts.isNonNullExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isTypeAssertionExpression(node)
    ? skipCasts(node.expression)
    : node;

// The value that an expression gives, through casts and the commas that end in it.
export const getGivenValue = (node: ts.Expression): ts.Expression => {
  const skipped = skipCasts(node);
  return ts.isBinaryExpression(skipped) && skipped.operatorToken.kind === ts.SyntaxKind.CommaToken
    ? getGivenValue(skipped.right)
    : skipped;
};

// A function that a script makes once and calls with new, which it makes into objects on the heap
// as it does a heap class: a constructor object, and the prototype that its instances inherit.
// Whether a function assigns a property or a variable it doesn't declare, itself or through the
// functions it calls.
// The built-in methods that change an array, a set, or a map in place.
const IN_PLACE_CHANGES = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
  "add",
  "set",
  "delete",
  "clear",
]);

export const changesState = (
  callee: ts.Node,
  node: ts.Node,
  context: Context,
  visited: Set<ts.Node>,
): boolean => {
  const target =
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ? node.left
      : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
          (node.operator === ts.SyntaxKind.PlusPlusToken ||
            node.operator === ts.SyntaxKind.MinusMinusToken)
        ? node.operand
        : ts.isDeleteExpression(node)
          ? node.expression
          : undefined;
  const declaration =
    target !== undefined && ts.isIdentifier(skipCasts(target))
      ? context.checker.getSymbolAtLocation(skipCasts(target))?.valueDeclaration
      : undefined;
  if (
    target !== undefined &&
    (declaration === undefined ||
      declaration.getSourceFile() !== callee.getSourceFile() ||
      declaration.pos < callee.pos ||
      declaration.end > callee.end)
  ) {
    return true;
  }
  if (ts.isCallExpression(node)) {
    const called =
      getCallee(node.expression, context) ?? getCalledMethod(node.expression, context)?.method;
    if (called !== undefined && !visited.has(called)) {
      visited.add(called);
      if (changesState(called, called, context, visited)) return true;
    }
    // A built-in method that changes in place an array or a collection that isn't a local, or that
    // the heap holds, which a local may name.
    const receiver = isMethodCall(node) ? skipCasts(node.expression.expression) : undefined;
    const local =
      receiver !== undefined && ts.isIdentifier(receiver)
        ? context.checker.getSymbolAtLocation(receiver)?.valueDeclaration
        : undefined;
    if (
      called === undefined &&
      receiver !== undefined &&
      isMethodCall(node) &&
      IN_PLACE_CHANGES.has(node.expression.name.text) &&
      (local === undefined ||
        local.pos < callee.pos ||
        local.end > callee.end ||
        isHeapArray(receiver, context) ||
        isHeapSetOrMap(receiver, context))
    ) {
      return true;
    }
  }
  return (
    ts.forEachChild(node, (child) => changesState(callee, child, context, visited) || undefined) ??
    false
  );
};

const accessorFunctions = new WeakMap<ts.SourceFile, Map<string, AccessorFunction[]>>();

// The functions that a script writes as the get or the set of a property descriptor, which a read
// or a write of a property that tla-ts can't resolve may run.
export const getAccessorFunctions = (node: ts.Node, field: "get" | "set", context: Context) => {
  const file = node.getSourceFile();
  const known = accessorFunctions.get(file);
  if (known !== undefined) return known.get(field) ?? [];
  const found = new Map<string, AccessorFunction[]>([
    ["get", []],
    ["set", []],
  ]);
  // A descriptor's get or set, which an object literal, as a property or a method, an assignment,
  // or a definition's value gives it.
  const visit = (child: ts.Node) => {
    const isAssigned =
      ts.isBinaryExpression(child) &&
      child.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(child.left);
    const definition =
      ts.isCallExpression(child) &&
      ts.isPropertyAccessExpression(child.expression) &&
      child.expression.name.text === "defineProperty"
        ? child.arguments
        : undefined;
    const attributes = definition?.at(2);
    const defined =
      attributes !== undefined && ts.isObjectLiteralExpression(attributes)
        ? attributes.properties.find(
            (property): property is ts.PropertyAssignment =>
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === "value",
          )
        : undefined;
    const name =
      ts.isPropertyAssignment(child) ||
      (ts.isMethodDeclaration(child) && ts.isObjectLiteralExpression(child.parent))
        ? child.name
        : isAssigned && ts.isPropertyAccessExpression(child.left)
          ? child.left.name
          : defined === undefined
            ? undefined
            : definition?.at(1);
    const list =
      name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name))
        ? found.get(name.text)
        : undefined;
    const value = ts.isPropertyAssignment(child)
      ? child.initializer
      : ts.isBinaryExpression(child)
        ? child.right
        : defined?.initializer;
    const accessor = ts.isMethodDeclaration(child)
      ? child
      : list === undefined || value === undefined
        ? undefined
        : getCallee(value, context);
    if (
      list !== undefined &&
      accessor !== undefined &&
      (ts.isFunctionDeclaration(accessor) ||
        ts.isFunctionExpression(accessor) ||
        ts.isMethodDeclaration(accessor)) &&
      getParameters(accessor).every((parameter) => parameter.dotDotDotToken === undefined) &&
      !list.includes(accessor)
    ) {
      list.push(accessor);
    }
    ts.forEachChild(child, visit);
  };
  visit(file);
  accessorFunctions.set(file, found);
  return found.get(field) ?? [];
};

const computedGetters = new WeakMap<ts.SourceFile, ts.GetAccessorDeclaration[]>();

// The getters of object literals whose keys computed names give, which no type names, so that a
// read runs the one it finds.
const getComputedGetters = (node: ts.Node) => {
  const file = node.getSourceFile();
  const known = computedGetters.get(file);
  if (known !== undefined) return known;
  const found = findNodes(
    file,
    (inner): inner is ts.GetAccessorDeclaration =>
      ts.isGetAccessorDeclaration(inner) &&
      ts.isObjectLiteralExpression(inner.parent) &&
      ts.isComputedPropertyName(inner.name),
  );
  computedGetters.set(file, found);
  return found;
};

const setAccessors = new WeakMap<ts.SourceFile, ts.SetAccessorDeclaration[]>();

// The setters that a script writes in object literals and classes under a key it names, of those
// that tla-ts inlines.
const getSetAccessors = (node: ts.Node, context: Context) => {
  const file = node.getSourceFile();
  const known = setAccessors.get(file);
  if (known !== undefined) return known;
  const found = findNodes(
    file,
    (inner): inner is ts.SetAccessorDeclaration =>
      ts.isSetAccessorDeclaration(inner) &&
      (getNameKey(inner.name) !== undefined || ts.isComputedPropertyName(inner.name)) &&
      isInlinedAccessor(inner, context),
  );
  setAccessors.set(file, found);
  return found;
};

const getNameKey = (name: ts.Node) =>
  ts.isIdentifier(name) || ts.isStringLiteral(name)
    ? name.text
    : ts.isNumericLiteral(name)
      ? String(Number(name.text))
      : undefined;

// The keys that a write may pick, or undefined where its key's type allows any.
const getWrittenKeys = (node: ts.Node, context: Context) => {
  const target = ts.isBinaryExpression(node)
    ? skipCasts(node.left)
    : ts.isExpression(node)
      ? skipCasts(node)
      : undefined;
  if (target !== undefined && ts.isPropertyAccessExpression(target)) return [target.name.text];
  const key =
    target !== undefined && ts.isElementAccessExpression(target)
      ? context.checker.getTypeAtLocation(target.argumentExpression)
      : undefined;
  const types = key === undefined ? [] : key.isUnion() ? key.types : [key];
  const literals = types.flatMap((type) =>
    type.isStringLiteral() || type.isNumberLiteral() ? [String(type.value)] : [],
  );
  return literals.length > 0 && literals.length === types.length ? literals : undefined;
};

// The setters that a write may run, which take the value as their first parameter. A parameter
// after it holds undefined, which one that TypeScript types as given can't.
export const getSetters = (node: ts.Node, context: Context) => {
  const keys = getWrittenKeys(node, context);
  return [
    ...getAccessorFunctions(node, "set", context),
    ...getReturnedFunctions(node, context),
    // A computed name may give any key.
    ...getSetAccessors(node, context).filter(
      (setter) =>
        keys === undefined ||
        ts.isComputedPropertyName(setter.name) ||
        keys.includes(getNameKey(setter.name) ?? ""),
    ),
  ].filter((setter) =>
    getParameters(setter)
      .slice(1)
      .every(
        (parameter) =>
          parameter.type === undefined ||
          parameter.questionToken !== undefined ||
          parameter.initializer !== undefined,
      ),
  );
};

// The properties that an assignment's target writes, alone or in a pattern.
export const getWrittenProperties = (
  target: ts.Node,
): (ts.PropertyAccessExpression | ts.ElementAccessExpression)[] =>
  ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
    ? [target]
    : ts.isParenthesizedExpression(target) ||
        ts.isSpreadElement(target) ||
        ts.isSpreadAssignment(target)
      ? getWrittenProperties(target.expression)
      : ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ? getWrittenProperties(target.left)
        : ts.isArrayLiteralExpression(target)
          ? target.elements.flatMap(getWrittenProperties)
          : ts.isObjectLiteralExpression(target)
            ? target.properties.flatMap((property) =>
                ts.isPropertyAssignment(property) || ts.isSpreadAssignment(property)
                  ? getWrittenProperties(
                      ts.isPropertyAssignment(property) ? property.initializer : property,
                    )
                  : [],
              )
            : [];

// The setters that a write of a property may run: the one its type names, and those the script
// defines that it may find there.
export const getPropertySetters = (target: ts.Expression, context: Context) =>
  [
    getObjectAccessor(target, ts.isSetAccessorDeclaration, context) ?? [],
    getSetters(target, context),
  ].flat();

// Whether a node makes a function or an object, which only a statement can. A type, such as one
// with an index signature, makes nothing.
const isMaking = (node: ts.Node): boolean =>
  !ts.isTypeNode(node) &&
  (ts.isFunctionLike(node) ||
    ts.isClassLike(node) ||
    ts.isObjectLiteralExpression(node) ||
    ts.isNewExpression(node) ||
    (ts.forEachChild(node, (child) => isMaking(child) || undefined) ?? false));

const returnedFunctions = new WeakMap<ts.SourceFile, HeapFunction[]>();

// The function objects that functions return, as a function they make or one a name holds, which a
// descriptor may give as a getter or a setter.
export const getReturnedFunctions = (node: ts.Node, context: Context) => {
  const file = node.getSourceFile();
  const known = returnedFunctions.get(file);
  if (known !== undefined) return known;
  const found = findNodes(file, ts.isReturnStatement).flatMap((statement) => {
    const returned = statement.expression;
    const named =
      returned !== undefined && ts.isIdentifier(returned)
        ? getCallee(returned, context)
        : undefined;
    return returned !== undefined &&
      ts.isFunctionExpression(returned) &&
      isNestedFunction(returned, context)
      ? [returned]
      : named !== undefined && (ts.isFunctionExpression(named) || ts.isFunctionDeclaration(named))
        ? [named]
        : [];
  });
  const unique = [...new Set(found)];
  returnedFunctions.set(file, unique);
  return unique;
};

// Whether a value of one type may be used as another, which any may not where the other is a type
// that tla-ts relies on. A value whose use has no type may be any.
const isFitting = (from: ts.Type, to: ts.Type | undefined, checker: ts.TypeChecker) =>
  to === undefined ||
  (to.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
  ((from.flags & ts.TypeFlags.Any) === 0 && checker.isTypeAssignableTo(from, to));

// The getters that a read can run as an expression, which take no argument, change nothing, and
// make no function or object: those that descriptors give, that functions return, and, for a read
// of super, which reads no getter through its own name, that a class or an object literal declares
// under the name that the read resolves to. Where super reads any, as in an object literal, those
// are the getters of object literals under its key that give the type its value is used as.
export const getGetters = (node: ts.Node, context: Context) =>
  [
    ...getAccessorFunctions(node, "get", context),
    ...getReturnedFunctions(node, context),
    ...getComputedGetters(node),
    ...(isSuperAccess(node) ? getSuperGetters(node, context) : []),
  ].filter(
    (getter) =>
      getParameters(getter).length === 0 &&
      getter.body !== undefined &&
      !isMaking(getter.body) &&
      !changesState(getter, getter.body, context, new Set([getter])),
  );

// Whether a function that super reads may run with the this of the method that reads super, which
// is the object that method belongs to, as the function's own object literal types its this. That
// object has each of the literal's properties, of a type that the literal's may hold, as its own
// literal may have more, which TypeScript would take as an excess property.
const isSuperThis = (
  candidate: FunctionNode,
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  checker: ts.TypeChecker,
) => {
  const home = ts.findAncestor(
    node.parent,
    (ancestor) => ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor),
  )?.parent;
  const literal = ts.isPropertyAssignment(candidate.parent)
    ? candidate.parent.parent
    : candidate.parent;
  return (
    findNodes(candidate, (inner): inner is ts.Node => inner.kind === ts.SyntaxKind.ThisKeyword)
      .length === 0 ||
    (home !== undefined &&
      ts.isObjectLiteralExpression(literal) &&
      checker
        .getTypeAtLocation(literal)
        .getProperties()
        .every((property) => {
          const own = checker.getTypeAtLocation(home).getProperty(property.name);
          return (
            own !== undefined &&
            checker.isTypeAssignableTo(
              checker.getTypeOfSymbol(own),
              checker.getTypeOfSymbol(property),
            )
          );
        }))
  );
};

const getSuperGetters = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  context: Context,
) => {
  const checker = context.checker;
  const name = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
  const declarations = getSymbol(name, checker)?.declarations;
  if (declarations !== undefined) return declarations.filter(ts.isGetAccessorDeclaration);
  if (!ts.isIdentifier(name) && !ts.isStringLiteralLike(name)) return [];
  return findNodes(node.getSourceFile(), (inner): inner is ts.GetAccessorDeclaration => {
    if (!ts.isGetAccessorDeclaration(inner) || !ts.isObjectLiteralExpression(inner.parent)) {
      return false;
    }
    const signature = checker.getSignatureFromDeclaration(inner);
    return (
      signature !== undefined &&
      isSuperThis(inner, node, checker) &&
      (ts.isIdentifier(inner.name) || ts.isStringLiteralLike(inner.name)) &&
      inner.name.text === name.text &&
      isFitting(
        checker.getReturnTypeOfSignature(signature),
        checker.getContextualType(node),
        checker,
      )
    );
  });
};

// The function whose @@hasInstance F[Symbol.hasInstance](value) calls.
export const getHasInstanceReceiver = (node: ts.CallExpression, context: Context) =>
  ts.isElementAccessExpression(node.expression) &&
  ts.isPropertyAccessExpression(node.expression.argumentExpression) &&
  getBuiltIn(node.expression.argumentExpression.expression, context) === "Symbol" &&
  node.expression.argumentExpression.name.text === "hasInstance"
    ? node.expression.expression
    : undefined;

// Whether a call's argument is where its parameter's type is an object's, so the callee may read,
// write or delete the properties of a function that it passes.
const isObjectArgument = (argument: ts.Expression, checker: ts.TypeChecker) => {
  const type = checker.getContextualType(argument);
  return (
    ts.isCallExpression(argument.parent) &&
    argument.parent.arguments.includes(argument) &&
    type !== undefined &&
    (type.flags & (ts.TypeFlags.NonPrimitive | ts.TypeFlags.Object)) !== 0 &&
    type.getCallSignatures().length === 0 &&
    type.getConstructSignatures().length === 0
  );
};

// The receiver that call or apply passes, as in f.call(function () {}).
const isCallReceiver = (node: ts.Node) =>
  ts.isCallExpression(node.parent) &&
  node.parent.arguments[0] === node &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  ["call", "apply"].includes(node.parent.expression.name.text);

// Whether a call passes what a name holds as an object.
const isPassedAsObject = (symbol: ts.Symbol, sourceFile: ts.SourceFile, context: Context) =>
  context.objectArguments.get(sourceFile)?.has(symbol) ?? false;

// The new that constructs a function or a class expression where the script writes it.
const getInPlaceNew = (node: ts.Node) => {
  const constructed = ts.findAncestor(
    node.parent,
    (ancestor) =>
      !ts.isParenthesizedExpression(ancestor) &&
      !ts.isAsExpression(ancestor) &&
      !ts.isTypeAssertionExpression(ancestor) &&
      !ts.isNonNullExpression(ancestor),
  );
  return (ts.isFunctionExpression(node) || ts.isClassExpression(node)) &&
    constructed !== undefined &&
    ts.isNewExpression(constructed) &&
    skipCasts(constructed.expression) === node
    ? constructed
    : undefined;
};

export const isHeapFunction = (node: ts.Node, context: Context): node is HeapFunction => {
  if (context.heap === undefined) return false;
  if (!ts.isFunctionDeclaration(node) && !ts.isFunctionExpression(node)) return false;
  const known = heapFunctions.get(node);
  if (known !== undefined) return known;
  // A variable or an object literal's property may name a function expression, as obj.f names
  // the function of { f: function () {} }.
  const nameNode = ts.isFunctionDeclaration(node)
    ? node.name
    : (ts.isVariableDeclaration(node.parent) || ts.isPropertyAssignment(node.parent)) &&
        node.parent.initializer === node
      ? node.parent.name
      : undefined;
  const symbol =
    nameNode === undefined || !ts.isIdentifier(nameNode)
      ? undefined
      : getSymbol(nameNode, context.checker);
  // A read names the function where it reads its variable, or its property of the object literal,
  // whose symbol each read of the object makes anew.
  const isNamedBy = (target: ts.Expression) => {
    const found = getSymbol(skipCasts(target), context.checker);
    return (
      found !== undefined &&
      (found === symbol ||
        (ts.isPropertyAssignment(node.parent) && found.valueDeclaration === node.parent))
    );
  };
  const sourceFile = node.getSourceFile();
  // A species constructor that a script writes, which a built-in method constructs.
  const written = node.parent;
  if (
    ts.isBinaryExpression(written) &&
    written.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    written.right === node &&
    ts.isElementAccessExpression(written.left) &&
    ts.isPropertyAccessExpression(written.left.argumentExpression) &&
    getBuiltIn(written.left.argumentExpression.expression, context) === "Symbol" &&
    written.left.argumentExpression.name.text === "species"
  ) {
    const isHeap = isPlain(node) && node.body !== undefined && isOnce(written, context);
    heapFunctions.set(node, isHeap);
    return isHeap;
  }
  // A function that a new constructs where the script writes it, which the new makes once. A body
  // that runs no code takes only arguments and defaults that can't throw or change anything.
  const constructed = getInPlaceNew(node);
  if (constructed !== undefined) {
    const isHeap =
      isPlain(node) &&
      isOnce(constructed, context) &&
      ((node.body?.statements.length ?? 0) > 0 ||
        [
          ...(constructed.arguments ?? []),
          ...node.parameters.flatMap((parameter) => parameter.initializer ?? []),
        ].every(isInertValue));
    heapFunctions.set(node, isHeap);
    return isHeap;
  }
  // A new or Reflect.construct constructs the function or takes it as newTarget, an Object
  // function reads or changes it as an object, or its @@hasInstance or an instanceof reads its
  // prototype.
  const isNewTarget = (child: ts.Node): boolean => {
    const construction = getConstruction(child, context);
    const receiver = ts.isCallExpression(child)
      ? getHasInstanceReceiver(child, context)
      : undefined;
    const targets =
      ts.isBinaryExpression(child) && child.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword
        ? [child.right]
        : ts.isCallExpression(child) &&
            ts.isPropertyAccessExpression(child.expression) &&
            getBuiltIn(child.expression.expression, context) === "Object" &&
            OWN_PROPERTY_FUNCTIONS.has(child.expression.name.text)
          ? child.arguments.slice(0, 1)
          : receiver !== undefined
            ? [receiver]
            : construction === undefined
              ? []
              : [construction.callee, construction.newTarget];
    return (
      targets.some(isNamedBy) ||
      (ts.forEachChild(child, (inner) => isNewTarget(inner) || undefined) ?? false)
    );
  };
  const isHeap =
    symbol !== undefined &&
    node.body !== undefined &&
    isPlain(node) &&
    isOnce(node.parent, context) &&
    !isAssigned(symbol, sourceFile, context) &&
    (isNewTarget(sourceFile) ||
      // An assignment writes one of its properties, or a call passes it as an object.
      findNodes(
        sourceFile,
        (child): child is ts.BinaryExpression =>
          ts.isBinaryExpression(child) &&
          child.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          (ts.isPropertyAccessExpression(child.left) || ts.isElementAccessExpression(child.left)) &&
          isNamedBy(child.left.expression),
      ).length > 0 ||
      isPassedAsObject(symbol, sourceFile, context));
  heapFunctions.set(node, isHeap);
  return isHeap;
};

// The heap class that a name names.
export const getHeapClass = (node: ts.Expression, context: Context): HeapClass | undefined => {
  const inPlace = skipCasts(node);
  if (getInPlaceNew(inPlace) !== undefined) {
    return isHeapFunction(inPlace, context) ||
      (ts.isClassExpression(inPlace) && isHeapClass(inPlace, context))
      ? inPlace
      : undefined;
  }
  const declaration = getSymbol(inPlace, context.checker)?.valueDeclaration;
  const found =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration !== undefined &&
          ts.isPropertyDeclaration(declaration) &&
          declaration.initializer !== undefined &&
          ts.isClassExpression(declaration.initializer) &&
          isOnceField(declaration.initializer, context)
        ? declaration.initializer
        : declaration;
  return found !== undefined &&
    ((ts.isClassLike(found) && isHeapClass(found, context)) || isHeapFunction(found, context))
    ? found
    : undefined;
};

// A value that evaluating can't throw or change.
export const isInertValue = (argument: ts.Expression): boolean =>
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

// A file that exports no function, which a spec exports as an action, runs as JavaScript does
// rather than as a spec's model.
export const isScript = (sourceFile: ts.SourceFile) =>
  sourceFile.statements.every(
    (statement) =>
      !ts.canHaveModifiers(statement) ||
      !(ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) ||
      !(ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.some(
            (declaration) => getFunction(declaration)?.body !== undefined,
          )
        : getFunction(statement)?.body !== undefined),
  );

// What a new, or a Reflect.construct of a list of arguments, constructs, the arguments it passes,
// and the newTarget whose prototype property gives the instance its prototype.
export interface Construction {
  callee: ts.Expression;
  arguments: readonly ts.Expression[];
  newTarget: ts.Expression;
}

// The built-in that a class extends where the class is a buffer's, a typed array's, Date's, or a
// collection's, which makes the class's instance as super(...args) would, with the same new.target.
const getConstructedBase = (callee: ts.Expression, context: Context) => {
  const declaration = getSymbol(skipCasts(callee), context.checker)?.valueDeclaration;
  const created =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration;
  const extended =
    created !== undefined && ts.isClassLike(created) ? getExtended(created) : undefined;
  return created !== undefined &&
    ts.isClassLike(created) &&
    extended !== undefined &&
    isNewTargetBase(getBuiltIn(extended, context) ?? "") &&
    getBuiltInBase(created, context) !== undefined
    ? extended
    : undefined;
};

// The function that a name holds where a call of bind gives the name, and the arguments that it
// binds, which new constructs the function with as it ignores the receiver. The name and what the
// bind reads must hold their values by the time new runs.
const getBoundConstruction = (node: ts.NewExpression, context: Context) => {
  const name = skipCasts(node.expression);
  const symbol = ts.isIdentifier(name) ? getSymbol(name, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  const call = initializer === undefined ? undefined : getBindCall(skipCasts(initializer));
  const target = call?.values[0];
  const made = target === undefined ? undefined : getNamedFunction(target, context);
  return symbol !== undefined &&
    initializer !== undefined &&
    call !== undefined &&
    target !== undefined &&
    made !== undefined &&
    isSteady(name, node, context) &&
    [target, ...call.values.slice(2)].every((value) => isSteady(value, initializer, context))
    ? { callee: target, arguments: call.values.slice(2) }
    : undefined;
};

export const getConstruction = (node: ts.Node, context: Context): Construction | undefined => {
  // A bound function constructs its target with its bound arguments first, and with the target as
  // new.target in place of itself.
  const bound = ts.isNewExpression(node) ? getBoundConstruction(node, context) : undefined;
  if (ts.isNewExpression(node) && bound !== undefined) {
    return {
      callee: bound.callee,
      arguments: [...bound.arguments, ...(node.arguments ?? [])],
      newTarget: bound.callee,
    };
  }
  if (ts.isNewExpression(node)) {
    return {
      callee: getConstructedBase(node.expression, context) ?? node.expression,
      arguments: node.arguments ?? [],
      newTarget: node.expression,
    };
  }
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "construct" ||
    getBuiltIn(node.expression.expression, context) !== "Reflect" ||
    node.arguments.length > 3
  ) {
    return undefined;
  }
  const callee = node.arguments.at(0);
  const list = node.arguments.at(1);
  const newTarget = node.arguments.at(2) ?? callee;
  return callee !== undefined &&
    newTarget !== undefined &&
    ts.isIdentifier(newTarget) &&
    list !== undefined &&
    ts.isArrayLiteralExpression(list) &&
    list.elements.every(
      (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
    )
    ? { callee: getConstructedBase(callee, context) ?? callee, arguments: list.elements, newTarget }
    : undefined;
};

// The Object functions that read or change only an object's own properties, its extensibility, and
// its prototype.
const OWN_PROPERTY_FUNCTIONS = new Set([
  "defineProperty",
  "freeze",
  "getOwnPropertyDescriptor",
  "getOwnPropertyNames",
  "getPrototypeOf",
  "hasOwn",
  "isExtensible",
  "isFrozen",
  "isSealed",
  "keys",
  "preventExtensions",
  "seal",
]);

// A new of a native error class, without a message or with a string, which a variable holds where
// each use reads it as an object: as an Object function's argument, as the object of a property
// access, in a comparison, typeof, or instanceof, or as the argument of a script's function whose
// parameter takes an object that isn't an error. The heap holds such an error as an object, with
// the slot that marks it as one, as it holds an error, new or called, that a place of type any
// keeps. An error that a script throws, or keeps elsewhere, stays a record.
// A SuppressedError takes its message after the error and the error that it suppressed.
// It assumes that the errors it is already deciding are held, so two of them can be compared.
export const isHeldError = (
  node: ts.Node,
  context: Context,
  assumed: ReadonlySet<ts.Node> = new Set(),
): node is ts.NewExpression | ts.CallExpression => {
  if (context.heap === undefined || !(ts.isNewExpression(node) || ts.isCallExpression(node))) {
    return false;
  }
  const name = getBuiltIn(node.expression, context);
  const holder = node.parent;
  const isSuppressed = name === "SuppressedError";
  // An AggregateError takes the array of its errors before its message and its options.
  const errors = name === "AggregateError" ? node.arguments?.at(0) : undefined;
  const message = node.arguments?.at(isSuppressed ? 2 : 0);
  if (
    name === undefined ||
    !NATIVE_ERRORS.has(name) ||
    (name === "AggregateError"
      ? errors === undefined || getKind(errors, context) !== "sequence"
      : (node.arguments ?? []).length > (isSuppressed ? 3 : 1) ||
        (message !== undefined &&
          getTypeNames(context.checker.getTypeAtLocation(message), context.checker)?.join() !==
            "string" &&
          (context.checker.getTypeAtLocation(message).flags &
            (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) ===
            0))
  ) {
    return false;
  }
  if (isAnyPlace(node, context)) return true;
  if (
    !ts.isNewExpression(node) ||
    !ts.isVariableDeclaration(holder) ||
    holder.initializer !== node ||
    !ts.isIdentifier(holder.name)
  ) {
    return false;
  }
  const symbol = getSymbol(holder.name, context.checker);
  const isObjectParameter = (call: ts.CallExpression, position: number) => {
    const declaration = context.checker.getResolvedSignature(call)?.getDeclaration();
    const parameter =
      declaration === undefined || declaration.getSourceFile().isDeclarationFile
        ? undefined
        : declaration.parameters.at(position);
    const type =
      parameter === undefined || parameter.dotDotDotToken !== undefined
        ? undefined
        : context.checker.getTypeAtLocation(parameter);
    return (
      type !== undefined &&
      type.getCallSignatures().length === 0 &&
      getErrorClass(context.checker.getNonNullableType(type).getSymbol(), context) === undefined
    );
  };
  const isObjectUse = (name: ts.Identifier) => {
    const child = ts.findAncestor(
      name,
      (ancestor) =>
        !ts.isParenthesizedExpression(ancestor.parent) &&
        !ts.isAsExpression(ancestor.parent) &&
        !ts.isSatisfiesExpression(ancestor.parent) &&
        !ts.isNonNullExpression(ancestor.parent),
    );
    const parent = child?.parent;
    if (child === undefined || parent === undefined) return false;
    if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
      return parent.expression === child;
    }
    if (ts.isTypeOfExpression(parent)) return true;
    // A descriptor in the map that Object.create or Object.defineProperties reads.
    if (ts.isPropertyAssignment(parent)) {
      const call = parent.parent.parent;
      return (
        parent.initializer === child &&
        ts.isCallExpression(call) &&
        ts.isPropertyAccessExpression(call.expression) &&
        getBuiltIn(call.expression.expression, context) === "Object" &&
        call.arguments.some((argument) => argument === parent.parent)
      );
    }
    if (ts.isBinaryExpression(parent)) {
      const kind = parent.operatorToken.kind;
      // An error that stays a record can't equal one that the heap holds.
      const other = skipCasts(parent.left === child ? parent.right : parent.left);
      return (
        ([
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ts.SyntaxKind.EqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsToken,
        ].includes(kind) &&
          (getErrorClass(
            context.checker
              .getNonNullableType(context.checker.getTypeAtLocation(other))
              .getSymbol(),
            context,
          ) === undefined ||
            isHeldErrorName(other, context, new Set([...assumed, node])))) ||
        (kind === ts.SyntaxKind.InstanceOfKeyword && parent.left === child)
      );
    }
    if (!ts.isCallExpression(parent) || parent.expression === child) return false;
    const callee = parent.expression;
    return (
      (ts.isPropertyAccessExpression(callee) &&
        getBuiltIn(callee.expression, context) === "Object") ||
      (ts.isPropertyAccessExpression(callee) &&
        callee.name.text === "call" &&
        callee.expression.getText().startsWith("Object.prototype.")) ||
      // An array method that call runs on the error reads its length and its indices.
      (getArrayMethodCall(parent, context) !== undefined && parent.arguments[0] === child) ||
      isObjectParameter(
        parent,
        parent.arguments.findIndex((argument) => argument === child),
      )
    );
  };
  const isEveryUse = (child: ts.Node): boolean =>
    (child === holder.name ||
      !ts.isIdentifier(child) ||
      getSymbol(child, context.checker) !== symbol ||
      isObjectUse(child)) &&
    !(ts.forEachChild(child, (inner) => !isEveryUse(inner) || undefined) ?? false);
  return symbol !== undefined && isEveryUse(node.getSourceFile());
};

// A name whose variable holds such an error.
export const isHeldErrorName = (
  node: ts.Expression,
  context: Context,
  assumed: ReadonlySet<ts.Node> = new Set(),
) => {
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  return (
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    (assumed.has(declaration.initializer) || isHeldError(declaration.initializer, context, assumed))
  );
};

// The heap class that a new names, or that Reflect.construct constructs with a newTarget that is
// a constructor, so that it can't throw.
export const getNewClass = (node: ts.Node, context: Context) => {
  const construction = getConstruction(node, context);
  if (construction === undefined) return undefined;
  const builtIn = getBuiltIn(construction.newTarget, context);
  return construction.newTarget === construction.callee ||
    getHeapClass(construction.newTarget, context) !== undefined ||
    (builtIn !== undefined && BUILT_INS[builtIn][4])
    ? getHeapClass(construction.callee, context)
    : undefined;
};

// A class's constructor, or a function, when its body runs statements, and else a class whose
// fields run a constructor. A derived class without a constructor runs its base's.
export const getRunConstructor = (
  node: HeapClass,
  context: Context,
): ts.ConstructorDeclaration | HeapClass | undefined => {
  if (!ts.isClassLike(node)) return (node.body?.statements.length ?? 0) > 0 ? node : undefined;
  const constructor = node.members.find(ts.isConstructorDeclaration);
  const base = getBaseClass(node, context);
  const run =
    constructor === undefined
      ? base && getRunConstructor(base, context)
      : (constructor.body?.statements.length ?? 0) > 0 || isNullBased(node)
        ? constructor
        : undefined;
  if (
    base !== undefined &&
    ((run !== undefined && ts.isClassLike(run)) || getRunFields(base, context).length > 0)
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't extend a class whose fields run as statements",
      node,
    );
  }
  return run ?? (getRunFields(node, context).length > 0 ? node : undefined);
};

// The fields of a class without a base that a new defines one at a time, as statements, from the
// first that runs a constructor.
export const getRunFields = (node: HeapClass, context: Context) => {
  if (!ts.isClassLike(node) || hasExtends(node)) return [];
  const fields = node.members.filter(
    (member): member is ts.PropertyDeclaration =>
      ts.isPropertyDeclaration(member) && !isStatic(member) && !isAmbient(member),
  );
  // A field whose call may throw defines itself as a statement too, so that what it throws leaves
  // the new, and so does one that assigns, which only a statement can run.
  const first = fields.findIndex((field) => {
    const created = field.initializer && getNewClass(field.initializer, context);
    const called = field.initializer && skipCasts(field.initializer);
    const callee =
      called !== undefined && ts.isCallExpression(called)
        ? getCallee(called.expression, context)
        : undefined;
    return (
      (created !== undefined && getRunConstructor(created, context) !== undefined) ||
      (callee !== undefined && mayThrow(callee, context)) ||
      (called !== undefined && getAssignedTarget(called) !== undefined)
    );
  });
  return first === -1 ? [] : fields.slice(first);
};

// The fields of a derived class whose constructor defines them once super(...) returns, as its
// base's constructor or the statements before super(...) run code, which would see them otherwise.
export const getFieldsAfterSuper = (node: HeapClass, context: Context) => {
  const base = ts.isClassLike(node) ? getBaseClass(node, context) : undefined;
  const constructor = ts.isClassLike(node)
    ? node.members.find(ts.isConstructorDeclaration)
    : undefined;
  return ts.isClassLike(node) &&
    constructor !== undefined &&
    base !== undefined &&
    (getRunConstructor(base, context) !== undefined ||
      getDeferredSuperCalls(constructor, context) !== undefined)
    ? node.members.filter(
        (member): member is ts.PropertyDeclaration =>
          ts.isPropertyDeclaration(member) && !isStatic(member) && !isAmbient(member),
      )
    : [];
};

// Whether a new is all that a statement, or an arrow's body, evaluates, besides the variable it
// initializes or assigns, so the statement can run the constructor.
export const isStatementNew = (node: ts.Expression) => {
  const parent = node.parent;
  return (
    ts.isExpressionStatement(parent) ||
    ts.isReturnStatement(parent) ||
    ts.isThrowStatement(parent) ||
    (ts.isArrowFunction(parent) && parent.body === node) ||
    (ts.isPropertyDeclaration(parent) &&
      parent.initializer === node &&
      (isStatic(parent) || !hasExtends(parent.parent))) ||
    (ts.isVariableDeclaration(parent) &&
      parent.initializer === node &&
      ts.isIdentifier(parent.name) &&
      ts.isVariableStatement(parent.parent.parent)) ||
    (ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.right === node &&
      ts.isIdentifier(parent.left) &&
      ts.isExpressionStatement(parent.parent))
  );
};

// The member of a heap class that a private name names.
// The private name that a statement's expression reads, writes, or calls on this or a name before
// it evaluates anything else, which throws a TypeError where the object lacks it.
export const getLeadingPrivate = (node: ts.Expression): ts.PropertyAccessExpression | undefined => {
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isPrivateIdentifier(node.name) &&
    (node.expression.kind === ts.SyntaxKind.ThisKeyword || ts.isIdentifier(node.expression))
  ) {
    return node;
  }
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node) ||
    ts.isCallExpression(node) ||
    ts.isAwaitExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isVoidExpression(node)
  ) {
    return getLeadingPrivate(node.expression);
  }
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return getLeadingPrivate(node.operand);
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return getLeadingPrivate(node.left);
  // A plain assignment checks its target only after it evaluates its value, and a pattern its
  // first target after it reads the value's first element or property.
  const right = skipCasts(node.right);
  const first = ts.isArrayLiteralExpression(node.left)
    ? node.left.elements.at(0)
    : ts.isObjectLiteralExpression(node.left)
      ? node.left.properties.at(0)
      : node.left;
  const target =
    first === undefined
      ? undefined
      : ts.isSpreadElement(first)
        ? first.expression
        : ts.isPropertyAssignment(first)
          ? ts.isObjectLiteralExpression(right) &&
            right.properties.some((property) => property.name?.getText() === first.name.getText())
            ? first.initializer
            : undefined
          : ts.isExpression(first)
            ? first
            : undefined;
  return isInertValue(right) &&
    target !== undefined &&
    (target === node.left || !ts.isBinaryExpression(target))
    ? getLeadingPrivate(target)
    : undefined;
};

export const getPrivateMember = (name: ts.PrivateIdentifier, context: Context) => {
  const declaration = getSymbol(name, context.checker)?.valueDeclaration;
  return declaration !== undefined &&
    ts.isClassElement(declaration) &&
    ts.isClassLike(declaration.parent) &&
    isHeapClass(declaration.parent, context)
    ? declaration
    : undefined;
};

// A plain method that a script makes once, of an object literal or a heap class, which a value can
// name, since each call checks that the property still holds it.
// A method of an object literal may have a computed name, such as [Symbol.iterator].
export const getObjectMethod = (node: ts.Node | undefined, context: Context) => {
  if (node === undefined || !ts.isMethodDeclaration(node) || node.body === undefined) {
    return undefined;
  }
  if (ts.isObjectLiteralExpression(node.parent))
    return isOnce(node.parent, context) ? node : undefined;
  return (isPlainMethod(node) || isPrivateMethod(node)) &&
    ts.isClassLike(node.parent) &&
    isHeapClass(node.parent, context)
    ? node
    : undefined;
};

export interface CalledMethod {
  method: ts.MethodDeclaration | ts.GetAccessorDeclaration;
  receiver: ts.Expression;
  key: string;
  // A getter like `get method() { return this.#method; }` that the call reads the method through.
  getter?: ts.GetAccessorDeclaration;
}

// The object method that a callee such as obj.name or obj["name"] reads, which the call checks
// the object still holds: a plain method, or a generator method where the call makes a generator.
export const getCalledMethod = (
  node: ts.Expression,
  context: Context,
  isKind: (node: FunctionNode) => boolean = isPlain,
): CalledMethod | undefined => {
  const isAccess =
    context.heap !== undefined &&
    (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node));
  if (!isAccess) return undefined;
  const name = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
  if (!ts.isIdentifier(name) && !ts.isPrivateIdentifier(name) && !ts.isStringLiteralLike(name)) {
    return undefined;
  }
  const declaration = getSymbol(name, context.checker)?.valueDeclaration;
  const getter =
    declaration !== undefined &&
    ts.isGetAccessorDeclaration(declaration) &&
    isPlainAccessor(declaration) &&
    ts.isClassLike(declaration.parent) &&
    isHeapClass(declaration.parent, context)
      ? declaration
      : undefined;
  const returned = getter === undefined ? undefined : getReturnedMethod(getter, context);
  const method = getObjectMethod(returned ?? declaration, context);
  return method === undefined || !isKind(method)
    ? undefined
    : { method, receiver: node.expression, key: name.text, getter };
};

// A value that a literal writes, which reads the same wherever it runs.
export const isLiteral = (node: ts.Expression) =>
  ts.isLiteralExpression(node) ||
  [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
    node.kind,
  );

interface FactoryCall {
  closure: FunctionNode;
  bindings: [ts.Symbol, ts.Expression][];
  variables: ts.VariableDeclaration[];
}

// The function that a call to a factory returns, where the factory only declares functions before
// it returns one, and the call passes it literals. A constant that the call initializes stands for
// that function, which reads each parameter of the factory as the literal that the call passes.
// The factory may also declare variables that a literal or a parameter initializes, where a script
// calls it once, in a constant that it declares outside any function or block, so that the call's
// variables are the only ones.
export const getFactoryCall = (
  node: ts.Node | undefined,
  context: Context,
): FactoryCall | undefined => {
  if (node === undefined || !ts.isCallExpression(node)) return undefined;
  const factory = getAnyFunction(getSymbol(node.expression, context.checker)?.valueDeclaration);
  const body = factory?.body;
  if (factory === undefined || !isPlain(factory) || body === undefined) return undefined;
  const returned = ts.isBlock(body) ? body.statements.at(-1) : undefined;
  const statements = ts.isBlock(body) ? body.statements.slice(0, -1) : [];
  const variables = statements.flatMap((statement) =>
    ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.filter(
          (declaration) =>
            (statement.declarationList.flags & ts.NodeFlags.Const) === 0 ||
            getAnyFunction(declaration) === undefined,
        )
      : [],
  );
  const parameters = factory.parameters.map((parameter) =>
    getSymbol(parameter.name, context.checker),
  );
  const factorySymbol = getSymbol(node.expression, context.checker);
  const statement = node.parent.parent?.parent;
  const isDeclaringFunctions =
    statements.every((inner) =>
      ts.isVariableStatement(inner)
        ? inner.declarationList.declarations.every((declaration) =>
            ts.isIdentifier(declaration.name),
          )
        : ts.isFunctionDeclaration(inner) && inner.body !== undefined,
    ) &&
    variables.every(
      (variable) =>
        variable.initializer !== undefined &&
        (isLiteral(variable.initializer) ||
          (ts.isIdentifier(variable.initializer) &&
            parameters.includes(getSymbol(variable.initializer, context.checker)))),
    ) &&
    (variables.length === 0 ||
      (isScript(node.getSourceFile()) &&
        factory.getSourceFile() === node.getSourceFile() &&
        ts.isVariableDeclaration(node.parent) &&
        node.parent.initializer === node &&
        statement !== undefined &&
        ts.isVariableStatement(statement) &&
        ts.isSourceFile(statement.parent) &&
        // Nothing else names the factory, not even a shorthand property, so nothing calls it again.
        findNodes(node.getSourceFile(), ts.isIdentifier).every(
          (inner) =>
            inner === node.expression ||
            (factorySymbol?.declarations ?? []).some(
              (declaration) => ts.getNameOfDeclaration(declaration) === inner,
            ) ||
            (ts.isShorthandPropertyAssignment(inner.parent)
              ? context.checker.getShorthandAssignmentValueSymbol(inner.parent)
              : getSymbol(inner, context.checker)) !== factorySymbol,
        )));
  // An arrow whose body is an expression returns it.
  const expression = !ts.isBlock(body)
    ? body
    : returned !== undefined && ts.isReturnStatement(returned)
      ? returned.expression
      : undefined;
  const closure =
    expression === undefined
      ? undefined
      : (getAnyFunction(expression) ??
        getAnyFunction(getSymbol(expression, context.checker)?.valueDeclaration));
  if (
    !isDeclaringFunctions ||
    closure === undefined ||
    !isPlain(closure) ||
    ts.findAncestor(closure, (ancestor) => ancestor === body) === undefined ||
    node.arguments.length !== factory.parameters.length ||
    !node.arguments.every(isLiteral)
  ) {
    return undefined;
  }
  const bindings = factory.parameters.flatMap(
    (parameter, position): [ts.Symbol, ts.Expression][] => {
      const symbol = getSymbol(parameter.name, context.checker);
      return symbol === undefined ? [] : [[symbol, node.arguments[position]]];
    },
  );
  return bindings.length === factory.parameters.length &&
    factory.parameters.every(
      (parameter) =>
        ts.isIdentifier(parameter.name) &&
        parameter.initializer === undefined &&
        parameter.dotDotDotToken === undefined,
    )
    ? { closure, bindings, variables }
    : undefined;
};

// The function that a callee or callback names: one written in place, one declared elsewhere, one
// that a factory returns, or a method of a known class.
const resolve = (node: ts.Expression, context: Context) => {
  const declaration = getSymbol(skipCasts(node), context.checker)?.valueDeclaration;
  return (
    getAnyFunction(skipCasts(node)) ??
    getAnyFunction(declaration) ??
    (declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? getFactoryCall(declaration.initializer, context)?.closure
      : undefined) ??
    getMethod(node, context)
  );
};

export const getCallee = (node: ts.Expression, context: Context) => {
  const found = resolve(node, context);
  return found !== undefined && isPlain(found) ? found : undefined;
};

export const getFunctionOfKind = (
  node: ts.Expression,
  context: Context,
  isKind: (node: FunctionNode) => boolean,
) => {
  const found = resolve(node, context);
  return found !== undefined && isKind(found) ? found : undefined;
};

export const translateString = (value: string, context: Context) => {
  const modelValue = context.modelValues.get(value);
  return modelValue === undefined ? string(value) : identifier(modelValue);
};

const isTrivial = (value: Expression): boolean =>
  ["Identifier", "Number", "String", "ExceptAt"].includes(value.kind) ||
  (value.kind === "Prime" && isTrivial(value.expression));

export const getUndefined = (context: Context) => {
  context.prelude.add("Undefined");
  return identifier("Undefined");
};

// The value of a global that a write outside strict mode makes, before the write runs.
export const getUnresolvable = (context: Context) => {
  context.prelude.add("Unresolvable");
  return identifier("Unresolvable");
};

// Whether a global that a write outside strict mode makes doesn't exist yet.
export const isUnresolvable = (value: Expression, context: Context) =>
  apply("=", [value, getUnresolvable(context)]);

// Binds a value that an expression repeats to a LET definition, so that TLC evaluates it once.
export const share = (
  value: Expression,
  base: string,
  context: Context,
  use: (shared: Expression) => Expression,
) => {
  if (isTrivial(value)) return use(value);
  const name = context.names.getFresh(base);
  return letExpression([define(name, [], value)], use(identifier(name)));
};

export const getElement = (
  sequence: Expression,
  position: Expression,
  context: Context,
  missing = getUndefined(context),
) =>
  share(sequence, "sequence", context, (shared) =>
    share(position, "position", context, (at) =>
      ifExpression(apply("\\in", [at, apply("DOMAIN", [shared])]), index(shared, [at]), missing),
    ),
  );

// The nodes in a tree, its root included, that a test picks.
// Whether a function reads a name that it binds, directly or through its arguments object.
export const isNameRead = (name: ts.Identifier, within: ts.Node, context: Context) => {
  const symbol = getSymbol(name, context.checker);
  return findNodes(within, ts.isIdentifier).some(
    (other) =>
      other !== name &&
      (other.text === "arguments" || getSymbol(other, context.checker) === symbol),
  );
};

// A call of import(), which loads a module as a script runs.
export const isImportCall = (node: ts.Node): node is ts.ImportCall =>
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;

// The module that an import() of a string names.
export const getImportedModule = (node: ts.CallExpression, checker: ts.TypeChecker) => {
  const specifier = node.arguments.at(0);
  const module =
    specifier !== undefined && ts.isStringLiteralLike(specifier)
      ? checker.getSymbolAtLocation(specifier)?.valueDeclaration
      : undefined;
  return module !== undefined && ts.isSourceFile(module) && !module.isDeclarationFile
    ? module
    : undefined;
};

export const findNodes = <T extends ts.Node>(root: ts.Node, test: (node: ts.Node) => node is T) => {
  const found: T[] = [];
  const visit = (node: ts.Node) => {
    if (test(node)) found.push(node);
    ts.forEachChild(node, (child) => {
      visit(child);
    });
  };
  visit(root);
  return found;
};

// The function around a node whose locals it reads from an environment, past the functions that run
// once, whose locals the state holds.
export const getEnclosingFunction = (node: ts.Node, context: Context) =>
  ts.findAncestor(
    node.parent,
    (ancestor) => ts.isFunctionLike(ancestor) && !context.onceFunctions.has(ancestor),
  );

// The functions of a file that a value may hold where tla-ts can't tell which: those that no other
// function encloses, or that a function makes each time it runs or as its var holds them outside
// strict mode and that read none of its locals.
export const findFunctionCandidates = (sourceFile: ts.SourceFile, context: Context) =>
  findNodes(sourceFile, (inner): inner is FunctionNode => {
    const candidate =
      ts.isFunctionDeclaration(inner) || ts.isFunctionExpression(inner) || ts.isArrowFunction(inner)
        ? inner
        : getObjectMethod(inner, context);
    // A function that a function that runs once makes, once, holds one value, as a function that
    // no other function encloses does.
    const isOnceMade = () =>
      candidate !== undefined &&
      ts.findAncestor(candidate.parent, (ancestor) => context.onceFunctions.has(ancestor)) !==
        undefined &&
      getFunctionValue(candidate, context) === candidate;
    return (
      candidate?.body !== undefined &&
      (getEnclosingFunction(candidate, context) === undefined ||
        ((isNestedFunction(candidate, context) || isVarFunction(candidate) || isOnceMade()) &&
          getOuterLocals(candidate, context).length === 0))
    );
  });

// The functions that a value whose type has calls may hold, where tla-ts can't tell which, whose
// type TypeScript lets the value hold.
export const getFunctionCandidates = (callee: ts.Expression, context: Context) => {
  if (isHeldBuiltInObject(callee, context)) return [];
  const sourceFile = callee.getSourceFile();
  const found =
    context.functionCandidates.get(sourceFile) ?? findFunctionCandidates(sourceFile, context);
  const checker = context.checker;
  const type = checker.getTypeAtLocation(callee);
  const call = callee.parent;
  // What super reads in an object literal is any, which a call may pass anything and whose result
  // it may use as anything, so a method it runs takes the arguments' types and gives the type that
  // the call's value is used as.
  const isTyped = (candidate: FunctionNode) => {
    if (!isSuperAccess(callee) || !ts.isCallExpression(call)) return true;
    const signature = checker.getSignatureFromDeclaration(candidate);
    return (
      signature !== undefined &&
      isSuperThis(candidate, callee, checker) &&
      !call.arguments.some(ts.isSpreadElement) &&
      candidate.parameters.every((parameter, position) => {
        const argument = call.arguments.at(position);
        const parameterType = checker.getTypeAtLocation(parameter);
        return parameter.dotDotDotToken !== undefined
          ? argument === undefined
          : argument === undefined
            ? parameter.initializer !== undefined ||
              parameter.questionToken !== undefined ||
              checker.isTypeAssignableTo(checker.getUndefinedType(), parameterType)
            : isFitting(checker.getTypeAtLocation(argument), parameterType, checker);
      }) &&
      isFitting(
        checker.getReturnTypeOfSignature(signature),
        checker.getContextualType(call),
        checker,
      )
    );
  };
  return found.filter(
    (candidate) =>
      isReached(candidate, context) &&
      checker.isTypeAssignableTo(checker.getTypeAtLocation(candidate), type) &&
      isTyped(candidate),
  );
};

// Whether the model reaches a node's code, as no value holds a function that nothing names.
const isReached = (node: ts.Node, context: Context) => {
  const reached = context.reached;
  return (
    reached === undefined ||
    ts.findAncestor(node, (ancestor) => reached.has(ancestor)) !== undefined
  );
};

// The closures that a value whose type has calls may hold, whose type TypeScript lets it hold.
export const getClosures = (callee: ts.Expression, context: Context) => {
  if (isHeldBuiltInObject(callee, context)) return [];
  const type = context.checker.getTypeAtLocation(callee);
  return (context.closures.get(callee.getSourceFile()) ?? []).filter(
    (closure) =>
      isReached(closure, context) &&
      context.checker.isTypeAssignableTo(context.checker.getTypeAtLocation(closure), type),
  );
};
