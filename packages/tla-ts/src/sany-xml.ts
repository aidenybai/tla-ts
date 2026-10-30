import { TlaUnsupportedError } from "./errors";
import { setExitCode } from "./exit-codes";
import type { TlcVersion } from "./tlc-version";
import type { SanySpecification } from "./sany-generator";
import {
  CONSTANT_DECL_KIND,
  VARIABLE_DECL_KIND,
  getDeclarations,
  getOpDefs,
  type AssumeNode,
  type ExprOrOpArgNode,
  type FactNode,
  type LevelNode,
  type ModuleNode,
  type OpDeclNode,
  type OpDefNode,
  type OpApplNode,
  type SanyLocation,
  type Subst,
  type SymbolNode,
  type TheoremNode,
  type ProofPartNode,
  type InstanceNode,
  type UseOrHideNode,
} from "./sany-nodes";

// XMLExporterExitCode, and the status Java exits with on an exception that nothing catches.
export const XML_EXPORT_EXIT_CODE = {
  uncaughtException: 1,
  argsParsingFailure: 1,
  specParsingFailure: 2,
  unrepresentableCharacter: 7,
} as const;

interface XmlElement {
  tag: string;
  text?: string;
  cdata?: string;
  children: XmlElement[];
}

// The exception that SANY's XMLExporter throws for a node of a kind it can't export.
const getUnsupportedKindError = (kind: number) =>
  setExitCode(
    new TlaUnsupportedError(
      `java.lang.IllegalArgumentException: unsupported kind: ${kind} in xml export`,
    ),
    XML_EXPORT_EXIT_CODE.uncaughtException,
  );

const createElement = (tag: string, children: XmlElement[] = []): XmlElement => ({
  tag,
  children,
});

const createText = (tag: string, text: string | number): XmlElement => ({
  tag,
  text: String(text),
  children: [],
});

const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\r": "&#13;",
};

// Java's serializer also writes a character outside the Basic Multilingual Plane, which a Java
// string holds as two chars, as a character reference.
const escapeXml = (text: string) =>
  text.replace(/[&<>\r]|[\u{10000}-\u{10FFFF}]/gu, (character) =>
    character.length === 2 ? `&#${character.codePointAt(0)};` : XML_ENTITIES[character],
  );

// A character outside XML 1.0's Char production.
const UNREPRESENTABLE_CHARACTER = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u;

// XMLExporter.findUnrepresentableCharacterData: the first element, in document order, whose
// character data XML 1.0 cannot represent, with the character.
const findUnrepresentable = (
  element: XmlElement,
): { tag: string; character: string } | undefined => {
  const character = (element.cdata ?? element.text)?.match(UNREPRESENTABLE_CHARACTER)?.[0];
  if (character !== undefined) return { tag: element.tag, character };
  for (const child of element.children) {
    const found = findUnrepresentable(child);
    if (found) return found;
  }
  return undefined;
};

// The lines of Java's identity Transformer, which pretty prints with an indent amount of 2.
const printElement = (element: XmlElement, depth: number, indentAmount: number): string[] => {
  const indent = " ".repeat(depth * indentAmount);
  // An element whose text or character data is empty has no content, like an element without
  // children.
  if (element.cdata) {
    const data = element.cdata.replaceAll("]]>", "]]]]><![CDATA[>");
    return [`${indent}<${element.tag}><![CDATA[${data}]]></${element.tag}>`];
  }
  if (element.text) {
    return [`${indent}<${element.tag}>${escapeXml(element.text)}</${element.tag}>`];
  }
  if (element.children.length === 0) return [`${indent}<${element.tag}/>`];
  return [
    `${indent}<${element.tag}>`,
    ...element.children.flatMap((child) => printElement(child, depth + 1, indentAmount)),
    `${indent}</${element.tag}>`,
  ];
};

const getLocationElement = (location: SanyLocation) =>
  createElement("location", [
    createElement("column", [
      createText("begin", location.beginColumn),
      createText("end", location.endColumn),
    ]),
    createElement("line", [
      createText("begin", location.beginLine),
      createText("end", location.endLine),
    ]),
    createText("filename", location.file),
  ]);

type ContextNode = SymbolNode | TheoremNode | AssumeNode;

const getReferenceTag = (node: ContextNode) => {
  switch (node.kind) {
    case "FormalParam":
      return "FormalParamNodeRef";
    case "OpDecl":
      return "OpDeclNodeRef";
    case "Module":
      return "ModuleNodeRef";
    case "Theorem":
      return "TheoremNodeRef";
    case "Assume":
      return "AssumeNodeRef";
    case "ThmOrAssumpDef":
      return node.isTheorem ? "TheoremDefRef" : "AssumeDefRef";
    case "OpDef":
      return node.defKind === "UserDefined"
        ? "UserDefinedOpKindRef"
        : node.defKind === "BuiltIn"
          ? "BuiltInKindRef"
          : "ModuleInstanceKindRef";
  }
};

// java.util.HashMap, which holds SymbolContext's entries, and lists them by the bucket of their
// Integer key, and the entries of a bucket in the order they were added.
const getHashMapCapacity = (size: number, capacity = 16): number =>
  size > capacity * 0.75 ? getHashMapCapacity(size, capacity * 2) : capacity;

const getHashMapBucket = (key: number, capacity: number) => (key ^ (key >>> 16)) & (capacity - 1);

// Java's String.split, which drops the empty strings at the end.
const splitLines = (text: string) => {
  const lines = text.split(/\r?\n/);
  while (lines.at(-1) === "") lines.pop();
  return lines;
};

// Java's String.trim, which removes the control characters and spaces at either end.
const trimJava = (text: string) => text.replace(/^[\0-\x20]+|[\0-\x20]+$/g, "");

// The characters of Java's Character.isWhitespace, which include four control characters.
const TRAILING_WHITESPACE =
  // eslint-disable-next-line no-control-regex
  /[\t-\r\x1C-\x20\u1680\u2000-\u2006\u2008-\u200A\u2028\u2029\u205F\u3000]+$/;

// SyntaxTreeNode.unboxComment: the lines of a comment boxed in (** and **), without the box.
const unboxComment = (text: string) => {
  const start = text.indexOf("(**");
  const end = text.lastIndexOf("**)");
  if (start < 0 || end <= start) return text;
  const lines = splitLines(text);
  const beginLine = lines.findIndex((line) => line.includes("(**"));
  const endLine = lines.findLastIndex((line) => line.includes("**)"));
  if (beginLine < 0 || beginLine >= endLine) return text;
  return lines
    .slice(beginLine + 1, endLine)
    .map((line) => {
      const begin = line.indexOf("(*");
      const finish = line.indexOf("*)");
      if (begin < 0 || finish <= begin) return line;
      return line.slice(begin + 3, Math.max(begin + 3, finish)).replace(TRAILING_WHITESPACE, "");
    })
    .join("\n");
};

// SyntaxTreeNode.unboxBackslashStarComment: the lines of a comment, without the \* that starts
// them, when at least half of them start with one.
const unboxBackslashStarComment = (text: string) => {
  const lines = splitLines(text);
  const isCommentLine = (line: string) => trimJava(line).startsWith("\\*");
  if (lines.filter(isCommentLine).length < Math.floor(lines.length / 2)) return text;
  return lines
    .map((line) => {
      if (!isCommentLine(line)) return line;
      const start = line.indexOf("\\*") + 2;
      return line.slice(line[start] === " " ? start + 1 : start);
    })
    .join("\n");
};

export interface XmlExportOptions {
  // The TLC whose XMLExporter to reproduce.
  version: TlcVersion;
  // -r: only the root module, and only the declarations and definitions a module makes itself.
  isRestricted: boolean;
  // -u: the pre-comments without the boxes and \* that format them.
  isUncommented: boolean;
  // -t: the XML on one line.
  isTerse: boolean;
}

// The XML of SANY's XMLExporter: every module of the specification, and a context with an entry
// for each symbol, theorem and assumption that the modules refer to.
const exportSpecification = (
  modules: ModuleNode[],
  root: ModuleNode,
  { version, isRestricted, isUncommented }: XmlExportOptions,
) => {
  // TLC 1.7.4's XMLExporter writes fewer elements, which keeps their nodes out of the context.
  const isTlc174 = version === "1.7.4";
  // SymbolContext: SANY marks a node's UID as exported before it exports the node's definition,
  // which can export other definitions, and adds the definition to its entries after them.
  const keys = new Set<number>();
  const entries = new Map<number, XmlElement>();

  const getReference = (node: ContextNode, isOtherBug = false): XmlElement => {
    if (!keys.has(node.id)) {
      keys.add(node.id);
      entries.set(node.id, exportDefinition(node, isOtherBug));
    }
    return createElement(getReferenceTag(node), [createText("UID", node.id)]);
  };

  const withLevel = (
    element: XmlElement,
    node: { levelChecked: number; level: number },
    location: SanyLocation | undefined,
  ) => {
    const level = node.levelChecked === 0 ? [] : [createText("level", node.level)];
    const head = location ? [getLocationElement(location), ...level] : level;
    return { ...element, children: [...head, ...element.children] };
  };

  const getParamsElement = (
    params: { id: number }[],
    isLeibnizArg: boolean[] | undefined,
    nodes: SymbolNode[],
  ) =>
    createElement(
      "params",
      params.map((_, index) =>
        createElement("leibnizparam", [
          getReference(nodes[index]),
          ...(isLeibnizArg?.[index] ? [createElement("leibniz")] : []),
        ]),
      ),
    );

  const getPreCommentsElement = (comments: string[]) => {
    const text = comments
      .map((comment) => comment.trimEnd())
      .filter((comment) => comment.length > 0)
      .join("\n");
    const cdata = isUncommented ? unboxBackslashStarComment(unboxComment(text)) : text;
    return comments.length > 0 ? [{ tag: "pre-comments", cdata, children: [] }] : [];
  };

  const exportDefinition = (node: ContextNode, isOtherBug: boolean): XmlElement => {
    switch (node.kind) {
      case "FormalParam":
        return withLevel(
          createElement("FormalParamNode", [
            createText("uniquename", node.name),
            createText("arity", node.arity),
          ]),
          node,
          node.location,
        );
      case "OpDecl":
        return withLevel(
          createElement("OpDeclNode", [
            createText("uniquename", node.name),
            createText("arity", node.arity),
            createText("kind", node.declKind),
          ]),
          node,
          node.location,
        );
      case "OpDef": {
        // SANY's XMLExporter fails on the definition of a proof step that a DEF clause names.
        if (node.defKind === "NumberedProofStep") throw getUnsupportedKindError(37);
        if (node.defKind === "ModuleInstance") {
          return withLevel(
            createElement("ModuleInstanceKind", [
              createText("uniquename", node.name),
              ...(node.isLocal && !isTlc174 ? [createElement("local")] : []),
            ]),
            node,
            node.location,
          );
        }
        const params = node.params ?? [];
        if (node.defKind === "BuiltIn") {
          return withLevel(
            createElement("BuiltInKind", [
              createText("uniquename", node.name),
              createText("arity", node.arity),
              ...(node.params ? [getParamsElement(params, node.isLeibnizArg, params)] : []),
            ]),
            node,
            node.location,
          );
        }
        const body = node.body;
        const module = node.module;
        if (body === undefined || module === undefined) {
          throw new Error(`The definition of ${node.name} has no body`);
        }
        if (isTlc174) {
          return withLevel(
            createElement("UserDefinedOpKind", [
              createText("uniquename", node.name),
              createText("arity", node.arity),
              createElement("body", [exportExpression(body, isOtherBug)]),
              ...(node.params ? [getParamsElement(params, node.isLeibnizArg, params)] : []),
              ...(node.inRecursive ? [createElement("recursive")] : []),
            ]),
            node,
            node.location,
          );
        }
        return withLevel(
          createElement("UserDefinedOpKind", [
            createText("uniquename", node.name),
            createText("arity", node.arity),
            createElement("originalOperator", [getReference(node.source ?? node)]),
            createElement("originallyDefinedInModule", [getReference(module)]),
            createElement("body", [exportExpression(body, isOtherBug)]),
            getParamsElement(params, node.isLeibnizArg, params),
            ...getPreCommentsElement(node.preComments),
            ...(node.inRecursive ? [createElement("recursive")] : []),
            ...(node.recursiveSection >= 0
              ? [createText("recursiveSection", node.recursiveSection)]
              : []),
            ...(node.isLocal ? [createElement("local")] : []),
          ]),
          node,
          node.location,
        );
      }
      case "ThmOrAssumpDef":
        return withLevel(
          createElement(node.isTheorem ? "TheoremDefNode" : "AssumeDef", [
            createText("uniquename", node.name),
            exportExpression(node.body, isOtherBug),
          ]),
          node,
          node.location,
        );
      case "Module":
        return {
          tag: "ModuleNode",
          children: [getLocationElement(node.location), ...exportModuleChildren(node)],
        };
      case "Theorem":
        return withLevel(
          createElement("TheoremNode", [
            ...(node.definition
              ? [createElement("definition", [getReference(node.definition)])]
              : []),
            createElement("body", [exportExpression(node.body, false)]),
            ...(node.proof ? [exportExpression(node.proof, false)] : []),
            ...(node.isSuffices ? [createElement("suffices")] : []),
          ]),
          node,
          node.location,
        );
      case "Assume":
        return {
          ...createElement("AssumeNode"),
          children: [
            getLocationElement(node.location),
            createText("level", node.body.level),
            ...(node.definition
              ? [createElement("definition", [getReference(node.definition)])]
              : []),
            createElement("body", [exportExpression(node.body, false)]),
          ],
        };
    }
  };

  // The children of a ModuleNode element after its name, built in the order SANY builds them so
  // that the context entries they add appear in the same order.
  const exportModuleChildren = (module: ModuleNode): XmlElement[] => {
    // XMLExporter's filter for -r: a declaration or definition that the module makes itself.
    const isExported = (node: OpDeclNode | OpDefNode) => !isRestricted || node.module === module;
    return [
      createText("uniquename", module.name),
      ...(isTlc174
        ? []
        : [
            createElement(
              "extends",
              module.extendees
                .map((extendee) => extendee.name)
                .toSorted()
                .map((name) => createText("uniquename", name)),
            ),
          ]),
      ...getDeclarations(module, CONSTANT_DECL_KIND)
        .filter(isExported)
        .map((declaration) => getReference(declaration)),
      ...getDeclarations(module, VARIABLE_DECL_KIND)
        .filter(isExported)
        .map((declaration) => getReference(declaration)),
      ...getOpDefs(module)
        .filter(isExported)
        .map((definition) => getReference(definition)),
      ...module.topLevel.map((topLevel) =>
        topLevel.kind === "Instance" || topLevel.kind === "UseOrHide"
          ? exportExpression(topLevel, false)
          : getReference(topLevel),
      ),
      ...module.definitions
        .filter((definition): definition is ModuleNode => !isTlc174 && definition.kind === "Module")
        .map((inner) => getReference(inner)),
    ];
  };

  const exportSubst = (subst: Subst, isOtherBug: boolean) =>
    createElement("Subst", [getReference(subst.op), exportExpression(subst.expr, isOtherBug)]);

  const exportApplication = (node: OpApplNode, isInheritedOtherBug: boolean) => {
    // TLC 1.7.4's XMLExporter exports a specification with semantic errors, and fails on the node
    // that SANY puts where it found one.
    if (node.isNull && isTlc174) throw getUnsupportedKindError(0);
    const last = node.operands[node.operands.length - 1];
    const isOtherBug =
      isInheritedOtherBug ||
      (node.operator.name === "$Case" &&
        node.operands.length > 1 &&
        last?.kind === "OpAppl" &&
        last.operator.name === "$Pair" &&
        last.operands[0] === undefined);
    const operator = getReference(node.operator, isOtherBug);
    const operands = node.operands.map((operand, index) =>
      operand === undefined && index === 0 && isOtherBug
        ? isTlc174
          ? createText("StringNode", "$Other")
          : createElement("StringNode", [createText("StringValue", "$Other")])
        : exportExpression(operand as ExprOrOpArgNode, isOtherBug),
    );
    const tupleOrs = node.tupleOrs;
    const boundSymbols =
      node.unbounded === undefined && node.bounded === undefined
        ? []
        : [
            createElement("boundSymbols", [
              ...(node.unbounded ?? []).map((symbol, index) =>
                createElement("unbound", [
                  getReference(symbol, isOtherBug),
                  ...(tupleOrs?.[index] ? [createElement("tuple")] : []),
                ]),
              ),
              ...(node.bounded ?? []).map((symbols, index) =>
                createElement("bound", [
                  ...symbols.map((symbol) => getReference(symbol, isOtherBug)),
                  ...(tupleOrs?.[index] ? [createElement("tuple")] : []),
                  exportExpression(node.ranges[index], isOtherBug),
                ]),
              ),
            ]),
          ];
    return createElement("OpApplNode", [
      createElement("operator", [operator]),
      createElement("operands", operands),
      ...boundSymbols,
    ]);
  };

  const exportFact = (fact: FactNode, isOtherBug: boolean) =>
    fact.kind === "Module" || fact.kind === "OpDef"
      ? getReference(fact, isOtherBug)
      : exportExpression(fact, isOtherBug);

  const exportExpression = (node: ExportedNode, isOtherBug: boolean): XmlElement => {
    switch (node.kind) {
      case "OpAppl":
        return withLevel(exportApplication(node, isOtherBug), node, node.location);
      case "Numeral":
        return withLevel(
          createElement("NumeralNode", [createText("IntValue", node.value)]),
          node,
          node.location,
        );
      case "String":
        return withLevel(
          createElement("StringNode", [createText("StringValue", node.value)]),
          node,
          node.location,
        );
      case "Decimal":
        return withLevel(
          createElement("DecimalNode", [
            createText("mantissa", node.mantissa),
            createText("exponent", node.exponent),
            ...(isTlc174
              ? []
              : [
                  createText("integralPart", node.integralPart),
                  createText("fractionalPart", node.fractionalPart),
                ]),
          ]),
          node,
          node.location,
        );
      case "LetIn": {
        const body = exportExpression(node.body, isOtherBug);
        return withLevel(
          createElement("LetInNode", [
            createElement("body", [body]),
            createElement(
              "opDefs",
              node.opDefs.map((definition) => getReference(definition, isOtherBug)),
            ),
          ]),
          node,
          node.location,
        );
      }
      case "Label":
        return withLevel(
          createElement("LabelNode", [
            createText("uniquename", node.name),
            createText("arity", node.params.length),
            createElement("body", [exportExpression(node.body, isOtherBug)]),
            createElement(
              "params",
              node.params.map((param) => getReference(param, isOtherBug)),
            ),
          ]),
          node,
          node.location,
        );
      case "OpArg":
        return withLevel(
          createElement("OpArgNode", [
            createElement("argument", [getReference(node.op, isOtherBug)]),
          ]),
          node,
          node.location,
        );
      case "At": {
        const object = node.except.operands[0];
        const components = node.component.operands[0];
        if (object === undefined || components === undefined) {
          throw new Error("An @ refers to an incomplete EXCEPT");
        }
        return withLevel(
          createElement("AtNode", [
            exportExpression(object, isOtherBug),
            exportExpression(components, isOtherBug),
          ]),
          node,
          node.location,
        );
      }
      case "SubstIn":
      case "APSubstIn": {
        const substs = node.substs.map((subst) => exportSubst(subst, isOtherBug));
        const body = exportExpression(node.body, isOtherBug);
        return withLevel(
          createElement(node.kind === "SubstIn" ? "SubstInNode" : "APSubstInNode", [
            createElement("substs", substs),
            createElement("body", [body]),
            createElement("instFrom", [getReference(node.instantiatingModule, isOtherBug)]),
            createElement("instTo", [getReference(node.instantiatedModule, isOtherBug)]),
          ]),
          node,
          node.location,
        );
      }
      case "Instance": {
        const substs = node.substs.map((subst) => exportSubst(subst, isOtherBug));
        const params = node.params.map((param) => getReference(param, isOtherBug));
        return {
          ...createElement("InstanceNode"),
          children: [
            getLocationElement(node.location),
            createText("level", 0),
            ...(node.name === undefined ? [] : [createText("uniquename", node.name)]),
            createText("module", node.module.name),
            createElement("substs", substs),
            createElement("params", params),
            ...(node.isLocal && !isTlc174 ? [createElement("local")] : []),
          ],
        };
      }
      case "UseOrHide":
        return withLevel(
          createElement("UseOrHideNode", [
            createElement(
              "facts",
              node.facts.map((fact) => exportFact(fact, isOtherBug)),
            ),
            createElement(
              "defs",
              node.defs.map((definition) => getReference(definition, isOtherBug)),
            ),
            ...(node.isOnly ? [createElement("only")] : []),
            ...(node.isHide ? [createElement("hide")] : []),
          ]),
          node,
          node.location,
        );
      case "NewSymb":
        return withLevel(
          createElement("NewSymbNode", [
            getReference(node.declaration, isOtherBug),
            ...(node.set ? [exportExpression(node.set, isOtherBug)] : []),
          ]),
          node,
          node.location,
        );
      case "AssumeProve":
        return withLevel(
          createElement("AssumeProveNode", [
            createElement(
              "assumes",
              node.assumptions.map((assumption) => exportExpression(assumption, isOtherBug)),
            ),
            createElement("prove", [exportExpression(node.goal, isOtherBug)]),
            ...(node.isSuffices ? [createElement("suffices")] : []),
            ...(node.isBoxed ? [createElement("boxed")] : []),
          ]),
          node,
          node.location,
        );
      case "LeafProof": {
        const isObvious = node.facts.length === 0 && node.defs.length === 0;
        const element = node.isOmitted
          ? createElement("omitted")
          : isObvious
            ? createElement("obvious")
            : createElement("by", [
                createElement(
                  "facts",
                  node.facts.map((fact) => exportFact(fact, isOtherBug)),
                ),
                createElement(
                  "defs",
                  node.defs.map((definition) => getReference(definition, isOtherBug)),
                ),
                ...(node.isOnly ? [createElement("only")] : []),
              ]);
        return withLevel(element, node, node.location);
      }
      case "NonLeafProof":
        return withLevel(
          createElement("steps", [
            ...(isTlc174 ? [] : [createText("proofLevel", node.proofLevel)]),
            ...node.steps.map((step) =>
              step.kind === "Theorem"
                ? getReference(step, isOtherBug)
                : exportExpression(step, isOtherBug),
            ),
          ]),
          node,
          node.location,
        );
      case "DefStep":
        return withLevel(
          createElement(
            "DefStepNode",
            node.defs.map((definition) => getReference(definition, isOtherBug)),
          ),
          node,
          node.location,
        );
    }
  };

  const moduleReferences = (isRestricted ? [root] : modules).map((module) => getReference(module));
  const capacity = getHashMapCapacity(entries.size);
  const context = createElement(
    "context",
    [...entries.entries()]
      .toSorted(
        ([first], [second]) =>
          getHashMapBucket(first, capacity) - getHashMapBucket(second, capacity),
      )
      .map(([id, element]) => createElement("entry", [createText("UID", id), element])),
  );
  return createElement("modules", [
    createText("RootModule", root.name),
    context,
    ...moduleReferences,
  ]);
};

type ExportedNode = LevelNode | InstanceNode | UseOrHideNode | ProofPartNode;

// The specification SANY accepts, level-checked, as SANY's tla2sany.xml.XMLExporter prints it
// with -o and the given options: every module the root module depends on, the standard modules
// among them, with the level of every expression.
export const exportSanyXml = (
  specification: SanySpecification,
  options: XmlExportOptions = {
    version: "master",
    isRestricted: false,
    isUncommented: false,
    isTerse: false,
  },
) => {
  const document = exportSpecification(specification.modules, specification.root, options);
  const unrepresentable = findUnrepresentable(document);
  if (unrepresentable) {
    const codePoint = unrepresentable.character.codePointAt(0) ?? 0;
    throw setExitCode(
      new TlaUnsupportedError(
        `The spec contains the character U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} in the ${unrepresentable.tag} element. XML 1.0 cannot represent that character in character data, not even as a numeric character reference, so the spec cannot be exported until the character is removed from it.`,
      ),
      XML_EXPORT_EXIT_CODE.unrepresentableCharacter,
    );
  }
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
  return options.isTerse
    ? [declaration, ...printElement(document, 0, 0)].join("")
    : `${[declaration, ...printElement(document, 0, 2)].join("\n")}\n`;
};
