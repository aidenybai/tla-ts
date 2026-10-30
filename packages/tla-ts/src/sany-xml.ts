import { TlaJavaException, TlaUnsupportedError } from "./errors";
import { setExitCode } from "./exit-codes";
import type { TlcVersion } from "./tlc-version";
import type { SanySpecification } from "./sany-generator";
import {
  CONSTANT_DECL_KIND,
  VARIABLE_DECL_KIND,
  getDeclarations,
  getOpDefs,
  formatSanyLocation,
  isAbsent,
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
const getUnsupportedKind = (kind: number) =>
  `java.lang.IllegalArgumentException: unsupported kind: ${kind} in xml export`;

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
const printElement = (
  element: XmlElement,
  depth: number,
  indentAmount: number,
  lines: string[],
): void => {
  const indent = " ".repeat(depth * indentAmount);
  // An element whose text or character data is empty has no content, like an element without
  // children.
  if (element.cdata) {
    const data = element.cdata.replaceAll("]]>", "]]]]><![CDATA[>");
    lines.push(`${indent}<${element.tag}><![CDATA[${data}]]></${element.tag}>`);
    return;
  }
  if (element.text) {
    lines.push(`${indent}<${element.tag}>${escapeXml(element.text)}</${element.tag}>`);
    return;
  }
  if (element.children.length === 0) {
    lines.push(`${indent}<${element.tag}/>`);
    return;
  }
  lines.push(`${indent}<${element.tag}>`);
  for (const child of element.children) printElement(child, depth + 1, indentAmount, lines);
  lines.push(`${indent}</${element.tag}>`);
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

// A frame of the Java stack of TLC 1.7.4's XMLExporter, in package tla2sany, with the node that
// the frame reports when an exception unwinds it.
interface JavaFrame {
  at: string;
  failedFor?: string;
}

// A call by which TLC 1.7.4's XMLExporter exports an expression that may be the null SANY generates
// for an operator it can't resolve, and how the JVM names that null.
interface JavaExpressionCall extends JavaFrame {
  nullType: string;
  nullValue: string;
}

const JAVA_CALLS = {
  main: { at: "xml.XMLExporter.main(XMLExporter.java:145)" },
  constant: { at: "semantic.ModuleNode.getSymbolElement(ModuleNode.java:1228)" },
  variable: { at: "semantic.ModuleNode.getSymbolElement(ModuleNode.java:1236)" },
  definition: { at: "semantic.ModuleNode.getSymbolElement(ModuleNode.java:1244)" },
  topLevel: { at: "semantic.ModuleNode.getSymbolElement(ModuleNode.java:1268)" },
  body: {
    at: "semantic.OpDefNode.getSymbolElement(OpDefNode.java:1392)",
    nullType: "ExprNode",
    nullValue: '"this.body"',
  },
  param: { at: "semantic.OpDefNode.getSymbolElement(OpDefNode.java:1397)" },
  builtInParam: { at: "semantic.OpDefNode.getSymbolElement(OpDefNode.java:1413)" },
  theoremDefinitionBody: {
    at: "semantic.ThmOrAssumpDefNode.getSymbolElement(ThmOrAssumpDefNode.java:663)",
    nullType: "LevelNode",
    nullValue: '"this.body"',
  },
  theoremDefinition: { at: "semantic.TheoremNode.getLevelElement(TheoremNode.java:439)" },
  theorem: {
    at: "semantic.TheoremNode.getLevelElement(TheoremNode.java:444)",
    nullType: "LevelNode",
    nullValue: 'the return value of "tla2sany.semantic.TheoremNode.getTheorem()"',
  },
  proof: { at: "semantic.TheoremNode.getLevelElement(TheoremNode.java:447)" },
  assumeDefinition: { at: "semantic.AssumeNode.getLevelElement(AssumeNode.java:249)" },
  assume: {
    at: "semantic.AssumeNode.getLevelElement(AssumeNode.java:254)",
    nullType: "ExprNode",
    nullValue: 'the return value of "tla2sany.semantic.AssumeNode.getAssume()"',
  },
  operator: { at: "semantic.OpApplNode.getLevelElement(OpApplNode.java:1315)" },
  operand: {
    at: "semantic.OpApplNode.getLevelElement(OpApplNode.java:1326)",
    nullType: "ExprOrOpArgNode",
    nullValue: '"this.operands[i]"',
  },
  unbound: { at: "semantic.OpApplNode.getLevelElement(OpApplNode.java:1337)" },
  bound: { at: "semantic.OpApplNode.getLevelElement(OpApplNode.java:1347)" },
  range: {
    at: "semantic.OpApplNode.getLevelElement(OpApplNode.java:1349)",
    nullType: "ExprNode",
    nullValue: '"this.ranges[i]"',
  },
  letBody: {
    at: "semantic.LetInNode.getLevelElement(LetInNode.java:301)",
    nullType: "ExprNode",
    nullValue: '"this.body"',
  },
  letDefinition: { at: "semantic.LetInNode.getLevelElement(LetInNode.java:303)" },
  labelBody: {
    at: "semantic.LabelNode.getLevelElement(LabelNode.java:341)",
    nullType: "LevelNode",
    nullValue: '"this.body"',
  },
  labelParam: { at: "semantic.LabelNode.getLevelElement(LabelNode.java:343)" },
  argument: { at: "semantic.OpArgNode.getLevelElement(OpArgNode.java:150)" },
  exceptObject: { at: "semantic.AtNode.getLevelElement(AtNode.java:180)" },
  exceptComponents: { at: "semantic.AtNode.getLevelElement(AtNode.java:181)" },
  substOperator: { at: "semantic.Subst.export(Subst.java:258)" },
  substExpression: {
    at: "semantic.Subst.export(Subst.java:259)",
    nullType: "ExprOrOpArgNode",
    nullValue: '"this.expr"',
  },
  instanceSubst: { at: "semantic.InstanceNode.getLevelElement(InstanceNode.java:447)" },
  instanceParam: { at: "semantic.InstanceNode.getLevelElement(InstanceNode.java:452)" },
  useFact: {
    at: "semantic.UseOrHideNode.getLevelElement(UseOrHideNode.java:175)",
    nullType: "LevelNode",
    nullValue: '"this.facts[i]"',
  },
  useDefinition: { at: "semantic.UseOrHideNode.getLevelElement(UseOrHideNode.java:176)" },
  newDeclaration: { at: "semantic.NewSymbNode.getLevelElement(NewSymbNode.java:202)" },
  newSet: { at: "semantic.NewSymbNode.getLevelElement(NewSymbNode.java:204)" },
  assumption: {
    at: "semantic.AssumeProveNode.getLevelElement(AssumeProveNode.java:404)",
    nullType: "SemanticNode",
    nullValue: '"assumes[i]"',
  },
  goal: {
    at: "semantic.AssumeProveNode.getLevelElement(AssumeProveNode.java:406)",
    nullType: "ExprNode",
    nullValue: 'the return value of "tla2sany.semantic.AssumeProveNode.getProve()"',
  },
  byFact: {
    at: "semantic.LeafProofNode.getLevelElement(LeafProofNode.java:154)",
    nullType: "LevelNode",
    nullValue: '"this.facts[i]"',
  },
  byDefinition: { at: "semantic.LeafProofNode.getLevelElement(LeafProofNode.java:155)" },
  step: {
    at: "semantic.NonLeafProofNode.getLevelElement(NonLeafProofNode.java:228)",
    nullType: "LevelNode",
    nullValue: '"this.steps[i]"',
  },
  defStep: { at: "semantic.DefStepNode.getLevelElement(DefStepNode.java:99)" },
} satisfies Record<string, JavaFrame | JavaExpressionCall>;

// The calls by which TLC 1.7.4's XMLExporter exports the parts of a SubstInNode or APSubstInNode.
const SUBST_IN_CALLS = {
  SubstIn: {
    subst: { at: "semantic.SubstInNode.getLevelElement(SubstInNode.java:530)" },
    body: {
      at: "semantic.SubstInNode.getLevelElement(SubstInNode.java:533)",
      nullType: "ExprNode",
      nullValue: '"this.body"',
    },
    from: { at: "semantic.SubstInNode.getLevelElement(SubstInNode.java:536)" },
    to: { at: "semantic.SubstInNode.getLevelElement(SubstInNode.java:540)" },
  },
  APSubstIn: {
    subst: { at: "semantic.APSubstInNode.getLevelElement(APSubstInNode.java:460)" },
    body: {
      at: "semantic.APSubstInNode.getLevelElement(APSubstInNode.java:463)",
      nullType: "LevelNode",
      nullValue: '"this.body"',
    },
    from: { at: "semantic.APSubstInNode.getLevelElement(APSubstInNode.java:466)" },
    to: { at: "semantic.APSubstInNode.getLevelElement(APSubstInNode.java:470)" },
  },
};

const SEMANTIC_EXPORT = "semantic.SemanticNode.export(SemanticNode.java:379)";
const LEVEL_EXPORT = "semantic.LevelNode.getSemanticElement(LevelNode.java:333)";
const UNSUPPORTED_KIND_FRAME = { at: "semantic.OpDefNode.getSymbolElement(OpDefNode.java:1424)" };
// Where SANY's builtin operators, such as nullODN, are.
const IN_BUILTINS = formatSanyLocation("--TLA+ BUILTINS--");

// The frames of the export of a node by reference in TLC 1.7.4's XMLExporter, down to the export
// of its definition, which reports the node.
const getDefinitionFrames = (kind: ContextNode["kind"], location: string): JavaFrame[] => {
  const [exportAt, putLine, definitionAt] =
    kind === "Theorem"
      ? [
          "TheoremNode.export(TheoremNode.java:456)",
          70,
          "TheoremNode.exportDefinition(TheoremNode.java:404)",
        ]
      : kind === "Assume"
        ? [
            "AssumeNode.export(AssumeNode.java:263)",
            80,
            "AssumeNode.exportDefinition(AssumeNode.java:207)",
          ]
        : [
            kind === "ThmOrAssumpDef"
              ? "ThmOrAssumpDefNode.export(ThmOrAssumpDefNode.java:671)"
              : "SymbolNode.export(SymbolNode.java:177)",
            60,
            "SymbolNode.exportDefinition(SymbolNode.java:138)",
          ];
  return [
    { at: `semantic.${exportAt}` },
    { at: `xml.SymbolContext.put(SymbolContext.java:${putLine})` },
    { at: `semantic.${definitionAt}`, failedFor: location },
  ];
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
  options: XmlExportOptions,
) => {
  // TLC 1.7.4's XMLExporter writes fewer elements, which keeps their nodes out of the context.
  const isTlc174 = options.version === "1.7.4";
  // SymbolContext: SANY marks a node's UID as exported before it exports the node's definition,
  // which can export other definitions, and adds the definition to its entries after them.
  const keys = new Set<number>();
  const entries = new Map<number, XmlElement>();
  // The Java stack of TLC 1.7.4's XMLExporter as it exports the current node, outermost first.
  const javaStack: JavaFrame[] = [];

  const withFrames = <Result>(frames: JavaFrame[], run: () => Result) => {
    if (!isTlc174) return run();
    javaStack.push(...frames);
    const result = run();
    javaStack.length -= frames.length;
    return result;
  };

  // TLC 1.7.4's XMLExporter reports the exception at each node it unwinds before the JVM reports
  // it uncaught.
  const getJavaException = (exception: string, frames: JavaFrame[]) => {
    const trace = [...javaStack, ...frames].reverse();
    const stackTrace = [exception, ...trace.map((frame) => `\tat tla2sany.${frame.at}`)].join("\n");
    const unwound = trace
      .filter((frame) => frame.failedFor !== undefined)
      .map(
        (frame) => `failed for node.toString(): ${frame.failedFor}\n with error \n${stackTrace}\n`,
      )
      .join("");
    return setExitCode(
      new TlaJavaException(stackTrace, unwound),
      XML_EXPORT_EXIT_CODE.uncaughtException,
    );
  };

  const getReference = (node: ContextNode, call?: JavaFrame, isOtherBug = false): XmlElement => {
    if (!keys.has(node.id)) {
      keys.add(node.id);
      entries.set(
        node.id,
        withFrames(
          [
            ...(call ? [call] : []),
            ...getDefinitionFrames(node.kind, formatSanyLocation(node.location)),
          ],
          () => exportDefinition(node, isOtherBug),
        ),
      );
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
    params: SymbolNode[],
    isLeibnizArg: boolean[] | undefined,
    call: JavaFrame,
  ) =>
    createElement(
      "params",
      params.map((param, index) =>
        createElement("leibnizparam", [
          getReference(param, call),
          ...(isLeibnizArg?.[index] ? [createElement("leibniz")] : []),
        ]),
      ),
    );

  const getPreCommentsElement = (comments: string[]) => {
    const text = comments
      .map((comment) => comment.trimEnd())
      .filter((comment) => comment.length > 0)
      .join("\n");
    const cdata = options.isUncommented ? unboxBackslashStarComment(unboxComment(text)) : text;
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
        if (node.defKind === "NumberedProofStep") {
          throw isTlc174
            ? getJavaException(getUnsupportedKind(37), [UNSUPPORTED_KIND_FRAME])
            : setExitCode(
                new TlaUnsupportedError(getUnsupportedKind(37)),
                XML_EXPORT_EXIT_CODE.uncaughtException,
              );
        }
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
              ...(node.params
                ? [getParamsElement(params, node.isLeibnizArg, JAVA_CALLS.builtInParam)]
                : []),
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
              createElement("body", [exportExpression(body, JAVA_CALLS.body, isOtherBug)]),
              ...(node.params
                ? [getParamsElement(params, node.isLeibnizArg, JAVA_CALLS.param)]
                : []),
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
            createElement("body", [exportExpression(body, JAVA_CALLS.body, isOtherBug)]),
            getParamsElement(params, node.isLeibnizArg, JAVA_CALLS.param),
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
            exportExpression(node.body, JAVA_CALLS.theoremDefinitionBody, isOtherBug),
          ]),
          node,
          node.location,
        );
      case "Module":
        return createElement("ModuleNode", [
          getLocationElement(node.location),
          ...exportModuleChildren(node),
        ]);
      case "Theorem":
        return withLevel(
          createElement("TheoremNode", [
            ...(node.definition
              ? [
                  createElement("definition", [
                    getReference(node.definition, JAVA_CALLS.theoremDefinition),
                  ]),
                ]
              : []),
            createElement("body", [exportExpression(node.body, JAVA_CALLS.theorem, false)]),
            ...(node.proof ? [exportExpression(node.proof, JAVA_CALLS.proof, false)] : []),
            ...(node.isSuffices ? [createElement("suffices")] : []),
          ]),
          node,
          node.location,
        );
      case "Assume":
        return createElement("AssumeNode", [
          getLocationElement(node.location),
          createText("level", node.body.level),
          ...(node.definition
            ? [
                createElement("definition", [
                  getReference(node.definition, JAVA_CALLS.assumeDefinition),
                ]),
              ]
            : []),
          createElement("body", [exportExpression(node.body, JAVA_CALLS.assume, false)]),
        ]);
    }
  };

  // The children of a ModuleNode element after its name, built in the order SANY builds them so
  // that the context entries they add appear in the same order.
  const exportModuleChildren = (module: ModuleNode): XmlElement[] => {
    // XMLExporter's filter for -r: a declaration or definition that the module makes itself.
    const isExported = (node: OpDeclNode | OpDefNode) =>
      !options.isRestricted || node.module === module;
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
        .map((declaration) => getReference(declaration, JAVA_CALLS.constant)),
      ...getDeclarations(module, VARIABLE_DECL_KIND)
        .filter(isExported)
        .map((declaration) => getReference(declaration, JAVA_CALLS.variable)),
      ...getOpDefs(module)
        .filter(isExported)
        .map((definition) => getReference(definition, JAVA_CALLS.definition)),
      ...module.topLevel.map((topLevel) =>
        topLevel.kind === "Instance" || topLevel.kind === "UseOrHide"
          ? exportExpression(topLevel, JAVA_CALLS.topLevel, false)
          : getReference(topLevel, JAVA_CALLS.topLevel),
      ),
      ...module.definitions
        .filter((definition): definition is ModuleNode => !isTlc174 && definition.kind === "Module")
        .map((inner) => getReference(inner)),
    ];
  };

  // A Subst is no SemanticNode, so it reports no exception that unwinds it.
  const exportSubst = (subst: Subst, call: JavaFrame, isOtherBug: boolean) =>
    withFrames([call], () =>
      createElement("Subst", [
        getReference(subst.op, JAVA_CALLS.substOperator),
        exportExpression(subst.expr, JAVA_CALLS.substExpression, isOtherBug),
      ]),
    );

  const exportApplication = (node: OpApplNode, isInheritedOtherBug: boolean) => {
    // TLC 1.7.4's XMLExporter exports a specification with semantic errors, and fails on the
    // operator of the node that SANY puts where it found one.
    if (node.isNull && isTlc174) {
      throw getJavaException(getUnsupportedKind(0), [
        JAVA_CALLS.operator,
        ...getDefinitionFrames("OpDef", IN_BUILTINS),
        UNSUPPORTED_KIND_FRAME,
      ]);
    }
    const last = node.operands[node.operands.length - 1];
    const isOtherBug =
      isInheritedOtherBug ||
      (node.operator.name === "$Case" &&
        node.operands.length > 1 &&
        last?.kind === "OpAppl" &&
        last.operator.name === "$Pair" &&
        last.operands[0] === undefined);
    const operator = getReference(node.operator, JAVA_CALLS.operator, isOtherBug);
    const operands = node.operands.map((operand, index) =>
      operand === undefined && index === 0 && isOtherBug
        ? isTlc174
          ? createText("StringNode", "$Other")
          : createElement("StringNode", [createText("StringValue", "$Other")])
        : exportExpression(operand as ExprOrOpArgNode, JAVA_CALLS.operand, isOtherBug),
    );
    const tupleOrs = node.tupleOrs;
    const boundSymbols =
      node.unbounded === undefined && node.bounded === undefined
        ? []
        : [
            createElement("boundSymbols", [
              ...(node.unbounded ?? []).map((symbol, index) =>
                createElement("unbound", [
                  getReference(symbol, JAVA_CALLS.unbound, isOtherBug),
                  ...(tupleOrs?.[index] ? [createElement("tuple")] : []),
                ]),
              ),
              ...(node.bounded ?? []).map((symbols, index) =>
                createElement("bound", [
                  ...symbols.map((symbol) => getReference(symbol, JAVA_CALLS.bound, isOtherBug)),
                  ...(tupleOrs?.[index] ? [createElement("tuple")] : []),
                  exportExpression(node.ranges[index], JAVA_CALLS.range, isOtherBug),
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

  const exportFact = (fact: FactNode, call: JavaExpressionCall, isOtherBug: boolean) =>
    fact.kind === "Module" || fact.kind === "OpDef"
      ? getReference(fact, call, isOtherBug)
      : exportExpression(fact, call, isOtherBug);

  // SemanticNode.export reports an exception that unwinds the export of a node.
  const exportExpression = (
    node: ExportedNode,
    call: JavaFrame | JavaExpressionCall,
    isOtherBug: boolean,
  ): XmlElement => {
    if (!isTlc174) return exportLevelNode(node, isOtherBug);
    if (node.kind === "OpAppl" && node.isAbsent && "nullType" in call) {
      throw getJavaException(
        `java.lang.NullPointerException: Cannot invoke "tla2sany.semantic.${call.nullType}.export(org.w3c.dom.Document, tla2sany.xml.SymbolContext)" because ${call.nullValue} is null`,
        [call],
      );
    }
    const failedFor =
      node.kind === "OpAppl" && node.isNull ? IN_BUILTINS : formatSanyLocation(node.location);
    const frames = [call, { at: SEMANTIC_EXPORT, failedFor }, { at: LEVEL_EXPORT }];
    return withFrames(frames, () => exportLevelNode(node, isOtherBug));
  };

  const exportLevelNode = (node: ExportedNode, isOtherBug: boolean): XmlElement => {
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
        const body = exportExpression(node.body, JAVA_CALLS.letBody, isOtherBug);
        return withLevel(
          createElement("LetInNode", [
            createElement("body", [body]),
            createElement(
              "opDefs",
              node.opDefs.map((definition) =>
                getReference(definition, JAVA_CALLS.letDefinition, isOtherBug),
              ),
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
            createElement("body", [exportExpression(node.body, JAVA_CALLS.labelBody, isOtherBug)]),
            createElement(
              "params",
              node.params.map((param) => getReference(param, JAVA_CALLS.labelParam, isOtherBug)),
            ),
          ]),
          node,
          node.location,
        );
      case "OpArg":
        return withLevel(
          createElement("OpArgNode", [
            createElement("argument", [getReference(node.op, JAVA_CALLS.argument, isOtherBug)]),
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
            exportExpression(object, JAVA_CALLS.exceptObject, isOtherBug),
            exportExpression(components, JAVA_CALLS.exceptComponents, isOtherBug),
          ]),
          node,
          node.location,
        );
      }
      case "SubstIn":
      case "APSubstIn": {
        const calls = SUBST_IN_CALLS[node.kind];
        const substs = node.substs.map((subst) => exportSubst(subst, calls.subst, isOtherBug));
        const body = exportExpression(node.body, calls.body, isOtherBug);
        return withLevel(
          createElement(node.kind === "SubstIn" ? "SubstInNode" : "APSubstInNode", [
            createElement("substs", substs),
            createElement("body", [body]),
            createElement("instFrom", [
              getReference(node.instantiatingModule, calls.from, isOtherBug),
            ]),
            createElement("instTo", [getReference(node.instantiatedModule, calls.to, isOtherBug)]),
          ]),
          node,
          node.location,
        );
      }
      case "Instance": {
        const substs = node.substs.map((subst) =>
          exportSubst(subst, JAVA_CALLS.instanceSubst, isOtherBug),
        );
        const params = node.params.map((param) =>
          getReference(param, JAVA_CALLS.instanceParam, isOtherBug),
        );
        return createElement("InstanceNode", [
          getLocationElement(node.location),
          createText("level", 0),
          ...(node.name === undefined ? [] : [createText("uniquename", node.name)]),
          createText("module", node.module.name),
          createElement("substs", substs),
          createElement("params", params),
          ...(node.isLocal && !isTlc174 ? [createElement("local")] : []),
        ]);
      }
      case "UseOrHide":
        return withLevel(
          createElement("UseOrHideNode", [
            createElement(
              "facts",
              node.facts.map((fact) => exportFact(fact, JAVA_CALLS.useFact, isOtherBug)),
            ),
            createElement(
              "defs",
              node.defs.map((definition) =>
                getReference(definition, JAVA_CALLS.useDefinition, isOtherBug),
              ),
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
            getReference(node.declaration, JAVA_CALLS.newDeclaration, isOtherBug),
            // TLC 1.7.4's NewSymbNode leaves out a set that is null.
            ...(node.set && !(isTlc174 && isAbsent(node.set))
              ? [exportExpression(node.set, JAVA_CALLS.newSet, isOtherBug)]
              : []),
          ]),
          node,
          node.location,
        );
      case "AssumeProve":
        return withLevel(
          createElement("AssumeProveNode", [
            createElement(
              "assumes",
              node.assumptions.map((assumption) =>
                exportExpression(assumption, JAVA_CALLS.assumption, isOtherBug),
              ),
            ),
            createElement("prove", [exportExpression(node.goal, JAVA_CALLS.goal, isOtherBug)]),
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
                  node.facts.map((fact) => exportFact(fact, JAVA_CALLS.byFact, isOtherBug)),
                ),
                createElement(
                  "defs",
                  node.defs.map((definition) =>
                    getReference(definition, JAVA_CALLS.byDefinition, isOtherBug),
                  ),
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
                ? getReference(step, JAVA_CALLS.step, isOtherBug)
                : exportExpression(step, JAVA_CALLS.step, isOtherBug),
            ),
          ]),
          node,
          node.location,
        );
      case "DefStep":
        return withLevel(
          createElement(
            "DefStepNode",
            node.defs.map((definition) => getReference(definition, JAVA_CALLS.defStep, isOtherBug)),
          ),
          node,
          node.location,
        );
    }
  };

  const moduleReferences = (options.isRestricted ? [root] : modules).map((module) =>
    getReference(module, JAVA_CALLS.main),
  );
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
  const lines = ['<?xml version="1.0" encoding="UTF-8" standalone="no"?>'];
  printElement(document, 0, options.isTerse ? 0 : 2, lines);
  return options.isTerse ? lines.join("") : `${lines.join("\n")}\n`;
};
