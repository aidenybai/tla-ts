import { TlaSyntaxError, TlaUnsupportedError } from "./errors";
import { generateSanySpecification } from "./sany-generator";
import { checkModuleLevels } from "./sany-levels";
import { SANY_STANDARD_MODULES } from "./sany-modules";
import { extractModule } from "./parser";
import {
  CONSTANT_DECL_KIND,
  formatSanyLocation,
  VARIABLE_DECL_KIND,
  getDeclarations,
  getOpDefs,
  type AssumeNode,
  type ExprOrOpArgNode,
  type FactNode,
  type LevelNode,
  type ModuleNode,
  type OpApplNode,
  type SanyLocation,
  type Subst,
  type SymbolNode,
  type TheoremNode,
  type ProofPartNode,
  type InstanceNode,
  type UseOrHideNode,
} from "./sany-nodes";

interface XmlElement {
  tag: string;
  text?: string;
  cdata?: string;
  children: XmlElement[];
}

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

const escapeXml = (text: string) =>
  text.replace(/[&<>\r]/g, (character) => XML_ENTITIES[character]);

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

// The pretty printing of Java's identity Transformer with an indent amount of 2.
const printElement = (element: XmlElement, depth: number): string[] => {
  const indent = "  ".repeat(depth);
  if (element.cdata !== undefined) {
    const data = element.cdata.replaceAll("]]>", "]]]]><![CDATA[>");
    return [`${indent}<${element.tag}><![CDATA[${data}]]></${element.tag}>`];
  }
  if (element.text !== undefined) {
    return [`${indent}<${element.tag}>${escapeXml(element.text)}</${element.tag}>`];
  }
  if (element.children.length === 0) return [`${indent}<${element.tag}/>`];
  return [
    `${indent}<${element.tag}>`,
    ...element.children.flatMap((child) => printElement(child, depth + 1)),
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

// The XML of SANY's XMLExporter: every module of the specification, and a context with an entry
// for each symbol, theorem and assumption that the modules refer to.
const exportSpecification = (modules: ModuleNode[], root: ModuleNode) => {
  const entries = new Map<number, XmlElement>();

  const getReference = (node: ContextNode, isOtherBug = false): XmlElement => {
    if (!entries.has(node.id)) {
      entries.set(node.id, createElement("pending"));
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
    return comments.length > 0 ? [{ tag: "pre-comments", cdata: text, children: [] }] : [];
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
          throw new TlaUnsupportedError("unsupported kind: 37 in xml export");
        }
        if (node.defKind === "ModuleInstance") {
          return withLevel(
            createElement("ModuleInstanceKind", [
              createText("uniquename", node.name),
              ...(node.isLocal ? [createElement("local")] : []),
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
    return [
      createText("uniquename", module.name),
      createElement(
        "extends",
        module.extendees
          .map((extendee) => extendee.name)
          .toSorted()
          .map((name) => createText("uniquename", name)),
      ),
      ...getDeclarations(module, CONSTANT_DECL_KIND).map((declaration) =>
        getReference(declaration),
      ),
      ...getDeclarations(module, VARIABLE_DECL_KIND).map((declaration) =>
        getReference(declaration),
      ),
      ...getOpDefs(module).map((definition) => getReference(definition)),
      ...module.topLevel.map((topLevel) =>
        topLevel.kind === "Instance" || topLevel.kind === "UseOrHide"
          ? exportExpression(topLevel, false)
          : getReference(topLevel),
      ),
      ...module.definitions
        .filter((definition): definition is ModuleNode => definition.kind === "Module")
        .map((inner) => getReference(inner)),
    ];
  };

  const exportSubst = (subst: Subst, isOtherBug: boolean) =>
    createElement("Subst", [getReference(subst.op), exportExpression(subst.expr, isOtherBug)]);

  const exportApplication = (node: OpApplNode, isInheritedOtherBug: boolean) => {
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
        ? createElement("StringNode", [createText("StringValue", "$Other")])
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
            createText("integralPart", node.integralPart),
            createText("fractionalPart", node.fractionalPart),
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
            ...(node.isLocal ? [createElement("local")] : []),
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
            createText("proofLevel", node.proofLevel),
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

  const moduleReferences = modules.map((module) => getReference(module));
  const context = createElement(
    "context",
    [...entries.entries()]
      .toSorted(([first], [second]) => first - second)
      .map(([id, element]) => createElement("entry", [createText("UID", id), element])),
  );
  return createElement("modules", [
    createText("RootModule", root.name),
    context,
    ...moduleReferences,
  ]);
};

type ExportedNode = LevelNode | InstanceNode | UseOrHideNode | ProofPartNode;

// The specification in the XML format of SANY's tla2sany.xml.XMLExporter, as its -o option prints
// it: every module the root module depends on, the standard modules among them, with the level of
// every expression.
export const exportSanyXml = (source: string, loadModule: (name: string) => string | undefined) => {
  const specification = generateSanySpecification(
    source,
    (name) => loadModule(name) ?? SANY_STANDARD_MODULES.get(name) ?? extractModule(source, name),
  );
  const error = specification.messages.find((message) => !message.isWarning);
  if (error) {
    throw new TlaSyntaxError(`${formatSanyLocation(error.location)}\n\n${error.text}`);
  }
  specification.modules.forEach((module) => checkModuleLevels(module));
  const document = exportSpecification(specification.modules, specification.root);
  const unrepresentable = findUnrepresentable(document);
  if (unrepresentable) {
    const codePoint = unrepresentable.character.codePointAt(0) ?? 0;
    throw new TlaUnsupportedError(
      `The spec contains the character U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} in the ${unrepresentable.tag} element. XML 1.0 cannot represent that character in character data, not even as a numeric character reference, so the spec cannot be exported until the character is removed from it.`,
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    ...printElement(document, 0),
  ].join("\n");
};
