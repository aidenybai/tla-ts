import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { isJavaScriptFile } from "./common-js";
import {
  findNodes,
  getImplicitGlobals,
  getVarScope,
  isStrictCode,
  skipCasts,
  WITH_STOP,
} from "./context";

// The functions that a with statement's rewrite calls, as ECMA-262 defines an object Environment
// Record's methods: ToObject of the statement's value (§14.11.2), HasBinding with its check of
// @@unscopables (§9.1.1.2.1), GetBindingValue (§9.1.1.2.6), and SetMutableBinding (§9.1.1.2.5). A
// Set runs in strict mode where the reference does. They stand on the text's first line, so the
// text keeps its lines. JavaScript gives their types in JSDoc, and declares the stop as a var that
// nothing assigns.
const getHelpers = (isJavaScript: boolean) => {
  const cast = (type: string, value: string) =>
    isJavaScript ? `/** @type {${type}} */ (${value})` : `(${value} as ${type})`;
  const typed = (type: string, value: string) =>
    isJavaScript ? `/** @type {${type}} */ (${value})` : `${value}`;
  const parameter = (name: string, type: string) => (isJavaScript ? name : `${name}: ${type}`);
  const returns = (type: string) => (isJavaScript ? "" : `: ${type}`);
  return [
    isJavaScript
      ? `/** @type {(reason: string) => never} */ var ${WITH_STOP};`
      : `declare function ${WITH_STOP}(reason: string): never;`,
    `const $tlaWithObject = ${typed(
      "<T>(value: T) => NonNullable<T>",
      `${isJavaScript ? "" : "<T,>"}(${parameter("value", "T")})${returns("NonNullable<T>")} => {` +
        `if (value === null || value === undefined) throw new TypeError("Cannot convert undefined or null to object");` +
        `if (typeof value !== "object" && typeof value !== "function") ${WITH_STOP}("tla-ts can't run a with statement on a primitive");` +
        `if (${cast("unknown", "value")} === globalThis) ${WITH_STOP}("tla-ts can't run a with statement on the global object");` +
        `return value; }`,
    )};`,
    `const $tlaWithThrowReference = ${typed(
      "(name: string) => never",
      `(${parameter("name", "string")})${returns("never")} => { throw new ReferenceError(name + " is not defined"); }`,
    )};`,
    `const $tlaWithHas = ${typed(
      "(object: any, name: string) => boolean",
      `(${parameter("object", "any")}, ${parameter("name", "string")})${returns("boolean")} => {` +
        `if (!(name in object)) return false;` +
        `const unscopables = ${cast("unknown", "object[Symbol.unscopables]")};` +
        `return !(((typeof unscopables === "object" && unscopables !== null) || typeof unscopables === "function") && ${cast("any", "unscopables")}[name]); }`,
    )};`,
    `const $tlaWithGet = ${typed(
      "(object: any, name: string, isStrict: boolean) => any",
      `(${parameter("object", "any")}, ${parameter("name", "string")}, ${parameter("isStrict", "boolean")})${returns("any")} => {` +
        `if (name in object) return object[name];` +
        `return isStrict ? $tlaWithThrowReference(name) : undefined; }`,
    )};`,
    `const $tlaWithSet = ${typed(
      "<T>(object: any, name: string, value: T, isStrict: boolean) => T",
      `${isJavaScript ? "" : "<T,>"}(${parameter("object", "any")}, ${parameter("name", "string")}, ${parameter("value", "T")}, ${parameter("isStrict", "boolean")})${returns("T")} => {` +
        `const isBound = name in object;` +
        `if (!isStrict) { object[name] = value; return value; }` +
        `if (!isBound) $tlaWithThrowReference(name);` +
        `(() => { "use strict"; object[name] = value; })();` +
        `return value; }`,
    )};`,
    `const $tlaWithUpdate = ${typed(
      "(object: any, name: string, isStrict: boolean, isIncrement: boolean, isPrefix: boolean) => any",
      `(${parameter("object", "any")}, ${parameter("name", "string")}, ${parameter("isStrict", "boolean")}, ${parameter("isIncrement", "boolean")}, ${parameter("isPrefix", "boolean")})${returns("any")} => {` +
        `let value = $tlaWithGet(object, name, isStrict);` +
        `const old = isIncrement ? value++ : value--;` +
        `$tlaWithSet(object, name, value, isStrict);` +
        `return isPrefix ? value : old; }`,
    )};`,
  ].join(" ");
};

const RESERVED_PREFIX = "$tlaWith";

const isWithin = (node: ts.Node, container: ts.Node) =>
  node.pos >= container.pos && node.end <= container.end;

// Whether a name is one that code reads or writes, rather than one that declares a binding, names
// a property or a label, or stands in a type. A class's extends clause reads a value.
const isReference = (node: ts.Identifier) => {
  const parent = node.parent;
  if (ts.isShorthandPropertyAssignment(parent)) return parent.name === node;
  if (ts.isPropertyAccessExpression(parent)) return parent.expression === node;
  if (
    ts.isBindingElement(parent) ||
    ts.isLabeledStatement(parent) ||
    ts.isBreakOrContinueStatement(parent) ||
    ("name" in parent && parent.name === node)
  ) {
    return false;
  }
  return (
    ts.findAncestor(
      parent,
      (ancestor) =>
        ts.isTypeNode(ancestor) &&
        !(ts.isExpressionWithTypeArguments(ancestor) && ts.isHeritageClause(ancestor.parent)),
    ) === undefined
  );
};

// A var's declaration, which binds its name in its function or its script.
const isVarDeclaration = (declaration: ts.Declaration) => {
  const root = ts.isBindingElement(declaration)
    ? ts.walkUpBindingElementsAndPatterns(declaration)
    : declaration;
  return (
    ts.isVariableDeclaration(root) &&
    ts.isVariableDeclarationList(root.parent) &&
    (root.parent.flags & ts.NodeFlags.BlockScoped) === 0
  );
};

// The name that a call, a new, or a tagged template calls through: the name it calls, or the name
// whose value holds the object of the method it calls.
const getCalleeHead = (node: ts.Expression): ts.Identifier | undefined => {
  const callee = skipCasts(node);
  if (ts.isIdentifier(callee)) return callee;
  return ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)
    ? getCalleeHead(callee.expression)
    : undefined;
};

const getCallee = (node: ts.Node) =>
  ts.isCallExpression(node) || ts.isNewExpression(node)
    ? node.expression
    : ts.isTaggedTemplateExpression(node)
      ? node.tag
      : undefined;

// The name whose value a call needs, or an instanceof whose left operand is a name, with what it
// does with the value. A call reads the name through the object's type where the type has it, and
// tla-ts's instanceof can't. Each branch looks the right operand up before it reads the left one,
// which only a proxy's trap or a getter could tell, where tla-ts stops.
const getTypedName = (node: ts.Node) => {
  const callee = getCallee(node);
  const head = callee === undefined ? undefined : getCalleeHead(callee);
  if (head !== undefined) return { name: head, action: "call a function", isTyped: true };
  if (
    !ts.isBinaryExpression(node) ||
    node.operatorToken.kind !== ts.SyntaxKind.InstanceOfKeyword ||
    !ts.isIdentifier(skipCasts(node.left))
  ) {
    return undefined;
  }
  const right = skipCasts(node.right);
  return ts.isIdentifier(right)
    ? { name: right, action: "test instanceof a class", isTyped: false }
    : undefined;
};

const isLogicalAssignment = (kind: ts.SyntaxKind) =>
  kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
  kind === ts.SyntaxKind.BarBarEqualsToken ||
  kind === ts.SyntaxKind.QuestionQuestionEqualsToken;

interface Head {
  name: ts.Identifier;
  text: string;
}

// How a name's reference runs: what it runs where the object of a with statement binds the name,
// and what it runs where none does.
interface Form {
  name: ts.Identifier;
  chain: ts.WithStatement[];
  getBranch: (statement: ts.WithStatement, object: string) => string;
  base: string;
}

// HACK: TypeScript neither binds nor types the names in a with statement's body. Outside strict
// mode, the text gains, in place of each with statement, a block whose constant holds the
// statement's object, and each name in its body that the object may bind looks in it first, as
// ECMA-262's object Environment Record does. A call through a name that the object holds runs
// only where the object's type has the name, and stops the check where it doesn't. The text
// stays on the same lines.
export const rewriteWithStatements = (file: ts.SourceFile, checker: ts.TypeChecker) => {
  const statements = findNodes(
    file,
    (node): node is ts.WithStatement => ts.isWithStatement(node) && !isStrictCode(node),
  );
  if (statements.length === 0) return file.text;
  const text = file.text;
  if (text.includes(RESERVED_PREFIX)) {
    throw new TlaTypeScriptError(
      `tla-ts can't rewrite a with statement in a script that names ${RESERVED_PREFIX}`,
      statements[0],
    );
  }
  const objects = new Map(
    statements.map((statement, index) => [statement, `${RESERVED_PREFIX}${index}`]),
  );
  const resolve = (name: ts.Identifier) =>
    checker.resolveName(name.text, name, ts.SymbolFlags.Value, false);
  const implicitGlobals = getImplicitGlobals(file, resolve);
  const getWithStatements = (node: ts.Node): ts.WithStatement[] => {
    const statement = ts.findAncestor(
      node.parent,
      (ancestor): ancestor is ts.WithStatement =>
        ts.isWithStatement(ancestor) && objects.has(ancestor) && isWithin(node, ancestor.statement),
    );
    return statement === undefined ? [] : [statement, ...getWithStatements(statement)];
  };
  // The with statements whose objects a name looks in, innermost first: those whose bodies hold
  // it, inside the scope that declares it. A function's arguments object has no declaration.
  const getChain = (name: ts.Identifier) => {
    const declarations = resolve(name)?.declarations ?? [];
    const argumentsOwner =
      name.text === "arguments" && declarations.length === 0
        ? ts.findAncestor(
            name.parent,
            (ancestor) => ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor),
          )
        : undefined;
    return getWithStatements(name).filter(
      (statement) =>
        !(argumentsOwner !== undefined && isWithin(argumentsOwner, statement.statement)) &&
        !declarations.some(
          (declaration) =>
            isWithin(declaration, statement.statement) &&
            !(isVarDeclaration(declaration) && getVarScope(declaration) === getVarScope(statement)),
        ),
    );
  };
  const isWithName = (node: ts.Node): node is ts.Identifier =>
    ts.isIdentifier(node) && isReference(node) && getChain(node).length > 0;
  const isDeclared = (name: ts.Identifier) =>
    resolve(name) !== undefined || implicitGlobals.has(name.text);
  const hasMember = (statement: ts.WithStatement, name: string) => {
    const type = checker.getTypeAtLocation(statement.expression);
    return (
      (type.flags & ts.TypeFlags.Any) === 0 &&
      checker.getPropertyOfType(checker.getApparentType(checker.getNonNullableType(type)), name) !==
        undefined
    );
  };
  const reject = (message: string, node: ts.Node): never => {
    throw new TlaTypeScriptError(`tla-ts can't ${message}`, node);
  };
  const rejectWrites = (node: ts.Node) => {
    const written = findNodes(node, isWithName).at(0);
    if (written !== undefined) {
      reject("assign a name that a with statement's object may bind in a pattern", written);
    }
  };
  const getCondition = (statement: ts.WithStatement, name: ts.Identifier) =>
    `$tlaWithHas(${objects.get(statement)}, ${JSON.stringify(name.text)})`;
  const printExpression = (form: Form) =>
    form.chain.reduceRight(
      (rest, statement) =>
        `(${getCondition(statement, form.name)} ? ${form.getBranch(statement, objects.get(statement) ?? "")} : ${rest})`,
      form.base,
    );
  const printStatement = (form: Form) =>
    `${form.chain
      .map(
        (statement) =>
          `if (${getCondition(statement, form.name)}) ${form.getBranch(statement, objects.get(statement) ?? "")}; else `,
      )
      .join("")}${form.base};`;
  const getForm = (node: ts.Node, head: Head | undefined): Form | undefined => {
    const getNameForm = (
      name: ts.Node,
      getBranch: (
        object: string,
        quoted: string,
        strict: string,
        statement: ts.WithStatement,
      ) => string,
      getBase: (name: ts.Identifier, quoted: string) => string,
    ): Form | undefined => {
      const operand = ts.isExpression(name) ? skipCasts(name) : name;
      if (!isWithName(operand) || operand === head?.name) return undefined;
      const quoted = JSON.stringify(operand.text);
      const strict = String(isStrictCode(operand));
      return {
        name: operand,
        chain: getChain(operand),
        getBranch: (statement, object) => getBranch(object, quoted, strict, statement),
        base: getBase(operand, quoted),
      };
    };
    const throwReference = (quoted: string) => `$tlaWithThrowReference(${quoted})`;
    if (ts.isIdentifier(node)) {
      return getNameForm(
        node,
        (object, quoted, strict) => `$tlaWithGet(${object}, ${quoted}, ${strict})`,
        (name, quoted) => (isDeclared(name) ? name.text : throwReference(quoted)),
      );
    }
    if (ts.isTypeOfExpression(node)) {
      return getNameForm(
        node.expression,
        (object, quoted, strict) => `typeof $tlaWithGet(${object}, ${quoted}, ${strict})`,
        (name) => (isDeclared(name) ? `typeof ${name.text}` : `"undefined"`),
      );
    }
    // Where no object binds the name, the delete stays one of the name.
    if (ts.isDeleteExpression(node)) {
      return getNameForm(
        node.expression,
        (object, quoted) =>
          isJavaScriptFile(file.fileName)
            ? `delete /** @type {any} */ (${object})[${quoted}]`
            : `delete (${object} as any)[${quoted}]`,
        (name) => `delete ${name.text}`,
      );
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      const operator = ts.tokenToString(node.operator) ?? "";
      const isPrefix = ts.isPrefixUnaryExpression(node);
      return getNameForm(
        node.operand,
        (object, quoted, strict) =>
          `$tlaWithUpdate(${object}, ${quoted}, ${strict}, ${node.operator === ts.SyntaxKind.PlusPlusToken}, ${isPrefix})`,
        (name, quoted) =>
          isDeclared(name)
            ? isPrefix
              ? `${operator}${name.text}`
              : `${name.text}${operator}`
            : throwReference(quoted),
      );
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      const left = skipCasts(node.left);
      if (ts.isObjectLiteralExpression(left) || ts.isArrayLiteralExpression(left)) {
        rejectWrites(left);
        return undefined;
      }
      if (!isWithName(left) || left === head?.name) return undefined;
      const kind = node.operatorToken.kind;
      const operator = ts.tokenToString(kind) ?? "";
      const binary = operator.slice(0, -1);
      const right = print(node.right, head);
      if (kind === ts.SyntaxKind.EqualsToken) {
        return getNameForm(
          left,
          (object, quoted, strict) => `$tlaWithSet(${object}, ${quoted}, ${right}, ${strict})`,
          (name, quoted) =>
            isDeclared(name) ? `${name.text} = ${right}` : `(${right}, ${throwReference(quoted)})`,
        );
      }
      return getNameForm(
        left,
        (object, quoted, strict) =>
          isLogicalAssignment(kind)
            ? `($tlaWithGet(${object}, ${quoted}, ${strict}) ${binary} $tlaWithSet(${object}, ${quoted}, ${right}, ${strict}))`
            : `$tlaWithSet(${object}, ${quoted}, $tlaWithGet(${object}, ${quoted}, ${strict}) ${binary} (${right}), ${strict})`,
        (name, quoted) =>
          isDeclared(name) ? `${name.text} ${operator} ${right}` : throwReference(quoted),
      );
    }
    // A call or an instanceof reads its name in each branch, and a call reads it through the
    // object's type where it has the name.
    const typed = getTypedName(node);
    return typed === undefined
      ? undefined
      : getNameForm(
          typed.name,
          (object, _quoted, _strict, statement) =>
            typed.isTyped && hasMember(statement, typed.name.text)
              ? print(node, { name: typed.name, text: `${object}.${typed.name.text}` })
              : `${WITH_STOP}("tla-ts can't ${typed.action} that a with statement's object holds")`,
          (name, quoted) =>
            isDeclared(name) ? print(node, { name, text: name.text }) : throwReference(quoted),
        );
  };
  // A yield of a name, which tla-ts runs where the yield's operand is a name or a call.
  const getStatementForm = (node: ts.Expression, head: Head | undefined): Form | undefined => {
    const expression = skipCasts(node);
    const yielded =
      ts.isYieldExpression(expression) &&
      expression.asteriskToken === undefined &&
      expression.expression !== undefined
        ? getForm(skipCasts(expression.expression), head)
        : undefined;
    return yielded === undefined
      ? getForm(expression, head)
      : {
          ...yielded,
          getBranch: (statement, object) => `yield ${yielded.getBranch(statement, object)}`,
          base: `yield ${yielded.base}`,
        };
  };
  const splice = (node: ts.Node, head: Head | undefined) => {
    const children: ts.Node[] = [];
    ts.forEachChild(node, (child) => {
      children.push(child);
    });
    const start = node.getStart(file);
    return `${children
      .map(
        (child, index) =>
          text.slice(index === 0 ? start : children[index - 1].end, child.getStart(file)) +
          print(child, head),
      )
      .join("")}${text.slice(children.at(-1)?.end ?? start, node.end)}`;
  };
  // A var statement whose initializers assign through a with statement's object, where it binds
  // the name: each declaration's own statement, which declares the var where no object binds the
  // name, so that the var keeps the type of its initializer.
  const printVarStatement = (node: ts.VariableStatement, head: Head | undefined) =>
    `{ ${node.declarationList.declarations
      .map((declaration) => {
        const name = declaration.name;
        const chain = ts.isIdentifier(name) ? getChain(name) : [];
        if (!ts.isIdentifier(name) || declaration.initializer === undefined || chain.length === 0) {
          return `var ${print(declaration, head)};`;
        }
        const initializer = print(declaration.initializer, head);
        return `${chain
          .map(
            (statement) =>
              `if (${getCondition(statement, name)}) $tlaWithSet(${objects.get(statement)}, ${JSON.stringify(name.text)}, ${initializer}, false); else `,
          )
          .join("")}{ var ${print(declaration, head)}; }`;
      })
      .join(" ")} }`;
  const isWithVarList = (node: ts.VariableDeclarationList) =>
    (node.flags & ts.NodeFlags.BlockScoped) === 0 &&
    node.declarations.some((declaration) =>
      ts.isIdentifier(declaration.name)
        ? getChain(declaration.name).length > 0
        : findNodes(declaration.name, ts.isIdentifier).some((name) => getChain(name).length > 0),
    );
  const print = (node: ts.Node, head?: Head): string => {
    if (node === head?.name) return head.text;
    if (ts.isWithStatement(node)) {
      const object = objects.get(node);
      return object === undefined
        ? splice(node, head)
        : `{ const ${object} = $tlaWithObject(${print(node.expression, head)}); ${print(node.statement, head)} }`;
    }
    if (
      ts.isVariableStatement(node) &&
      isWithVarList(node.declarationList) &&
      node.declarationList.declarations.every((declaration) => ts.isIdentifier(declaration.name))
    ) {
      return printVarStatement(node, head);
    }
    if (ts.isVariableDeclarationList(node) && isWithVarList(node)) {
      reject(
        "declare a var that a with statement's object may bind in a pattern or a loop's head",
        node,
      );
    }
    if (
      (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      !ts.isVariableDeclarationList(node.initializer)
    ) {
      rejectWrites(node.initializer);
    }
    if (ts.isShorthandPropertyAssignment(node) && isWithName(node.name)) {
      const form = getForm(node.name, head);
      return form === undefined
        ? splice(node, head)
        : `${node.name.text}: ${printExpression(form)}`;
    }
    if (ts.isExpressionStatement(node)) {
      const form = getStatementForm(node.expression, head);
      if (form !== undefined) return printStatement(form);
    }
    const form = getForm(node, head);
    return form === undefined ? splice(node, head) : printExpression(form);
  };
  const outermost = statements.filter(
    (statement) => !statements.some((other) => other !== statement && isWithin(statement, other)),
  );
  return (
    getHelpers(isJavaScriptFile(file.fileName)) +
    outermost.reduceRight(
      (current, statement) =>
        current.slice(0, statement.getStart(file)) +
        print(statement) +
        current.slice(statement.end),
      text,
    )
  );
};
