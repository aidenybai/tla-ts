import type {
  Fact,
  Module,
  Proof,
  ProofStep,
  SourceLocation,
  Theorem,
  UseOrHide,
} from "../src/ast";
import { getChild, getChildren, type XmlElement } from "./xml";

// A proof tree reduced to what both SANY and tla-ts can report: each node's kind, name, and
// location, with facts by their location and definitions by their names.
export type ProofDigest =
  | { kind: "omitted" | "obvious"; range: string | undefined }
  | { kind: "by"; range: string | undefined; only: boolean; facts: string[]; defs: string[] }
  | { kind: "steps"; range: string | undefined; level: number; steps: StepDigest[] };

export interface TheoremDigest {
  kind: string;
  name: string | undefined;
  range: string | undefined;
  proof: ProofDigest | undefined;
}

export interface UseDigest {
  kind: "use" | "hide";
  range: string | undefined;
  only: boolean;
  facts: string[];
  defs: string[];
}

export type StepDigest =
  | TheoremDigest
  | UseDigest
  | { kind: "define"; range: string | undefined; names: string[] }
  | { kind: "instance"; range: string | undefined };

export interface ModuleDigest {
  name: string;
  units: (TheoremDigest | UseDigest)[];
  modules: ModuleDigest[];
}

const STEP_KINDS = new Map([
  ["$Pfcase", "case"],
  ["$Pick", "pick"],
  ["$Take", "take"],
  ["$Have", "have"],
  ["$Witness", "witness"],
  ["$Suffices", "suffices"],
  ["$Qed", "qed"],
]);

const getText = (element: XmlElement | undefined) => element?.text ?? "";

export const digestSany = (document: XmlElement, moduleName: string): ModuleDigest => {
  const context = getChild(document, "context");
  const entries = new Map(
    (context?.children ?? []).map((entry) => [getText(getChild(entry, "UID")), entry.children[1]]),
  );
  const resolve = (reference: XmlElement) => {
    const node = entries.get(getText(getChild(reference, "UID")));
    if (!node) throw new Error(`SANY's XML has no entry for ${reference.name}`);
    return node;
  };
  const getName = (reference: XmlElement) => getText(getChild(resolve(reference), "uniquename"));
  const getRange = (node: XmlElement) => {
    const location = getChild(node, "location");
    if (!location) return undefined;
    const line = getChild(location, "line");
    const column = getChild(location, "column");
    const getBound = (element: XmlElement | undefined, bound: string) =>
      getText(element && getChild(element, bound));
    return `${getBound(line, "begin")}:${getBound(column, "begin")}-${getBound(line, "end")}:${getBound(column, "end")}`;
  };
  const getFact = (fact: XmlElement) => {
    if (fact.name === "ModuleNodeRef") return `module ${getName(fact)}`;
    if (fact.name === "ModuleInstanceKind")
      return `instance ${getText(getChild(fact, "uniquename"))}`;
    return getRange(fact) ?? fact.name;
  };
  const getFacts = (node: XmlElement) => (getChild(node, "facts")?.children ?? []).map(getFact);
  const getDefs = (node: XmlElement) => (getChild(node, "defs")?.children ?? []).map(getName);
  const digestUse = (node: XmlElement): UseDigest => ({
    kind: getChild(node, "hide") ? "hide" : "use",
    range: getRange(node),
    only: getChild(node, "only") !== undefined,
    facts: getFacts(node),
    defs: getDefs(node),
  });
  const getStepKind = (theorem: XmlElement, isStep: boolean) => {
    const body = getChild(theorem, "body")?.children[0];
    const operator = body && getChild(body, "operator")?.children[0];
    const builtin =
      operator?.name === "BuiltInKindRef" ? STEP_KINDS.get(getName(operator)) : undefined;
    return builtin ?? (isStep ? "assert" : "theorem");
  };
  const digestProof = (theorem: XmlElement): ProofDigest | undefined => {
    const proof = theorem.children.find((child) =>
      ["omitted", "obvious", "by", "steps"].includes(child.name),
    );
    if (!proof) return undefined;
    if (proof.name === "omitted" || proof.name === "obvious") {
      return { kind: proof.name, range: getRange(proof) };
    }
    if (proof.name === "by") {
      return {
        kind: "by",
        range: getRange(proof),
        only: getChild(proof, "only") !== undefined,
        facts: getFacts(proof),
        defs: getDefs(proof),
      };
    }
    return {
      kind: "steps",
      range: getRange(proof),
      level: Number(getText(getChild(proof, "proofLevel"))),
      steps: proof.children
        .filter((child) => child.name !== "location" && child.name !== "level")
        .filter((child) => child.name !== "proofLevel")
        .map(digestStep),
    };
  };
  const digestTheorem = (theorem: XmlElement, isStep: boolean): TheoremDigest => {
    const definition = getChild(theorem, "definition")?.children[0];
    return {
      kind: getStepKind(theorem, isStep),
      name: definition ? getName(definition) : undefined,
      range: getRange(theorem),
      proof: digestProof(theorem),
    };
  };
  const digestStep = (step: XmlElement): StepDigest => {
    if (step.name === "TheoremNodeRef") return digestTheorem(resolve(step), true);
    if (step.name === "TheoremNode") return digestTheorem(step, true);
    if (step.name === "UseOrHideNode") return digestUse(step);
    if (step.name === "DefStepNode") {
      return {
        kind: "define",
        range: getRange(step),
        names: step.children
          .filter((child) => child.name !== "location" && child.name !== "level")
          .map(getName),
      };
    }
    return { kind: "instance", range: getRange(step) };
  };
  const getFilename = (node: XmlElement) => {
    const location = getChild(node, "location");
    return location && getText(getChild(location, "filename"));
  };
  // A module also lists the theorems of the modules it extends, which come from other files.
  const digestModule = (module: XmlElement): ModuleDigest => {
    const filename = getFilename(module);
    return {
      name: getText(getChild(module, "uniquename")),
      units: module.children.flatMap((child) => {
        const node = child.name === "TheoremNodeRef" ? resolve(child) : child;
        if (getFilename(node) !== filename) return [];
        if (node.name === "TheoremNode") return [digestTheorem(node, false)];
        if (node.name === "UseOrHideNode") return [digestUse(node)];
        return [];
      }),
      modules: getChildren(module, "ModuleNodeRef")
        .map(resolve)
        .filter((nested) => getText(getChild(nested, "uniquename")) !== moduleName)
        .map(digestModule),
    };
  };
  const root = [...entries.values()].find(
    (node) => node.name === "ModuleNode" && getText(getChild(node, "uniquename")) === moduleName,
  );
  if (!root) throw new Error(`SANY's XML has no module ${moduleName}`);
  return digestModule(root);
};

const formatRange = (location: SourceLocation) => {
  const range = location.range;
  return range && `${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`;
};

const getFactDigest = (fact: Fact) =>
  fact.kind === "ModuleFact" ? `module ${fact.name}` : (formatRange(fact.location) ?? fact.kind);

const getDefName = (fact: Fact) => {
  if (fact.kind === "ModuleFact" || fact.kind === "Identifier") return fact.name;
  if (fact.kind === "OperatorReference" || fact.kind === "Apply") return fact.operator;
  return fact.kind;
};

const STEP_DIGEST_KINDS = new Map([
  ["Have", "have"],
  ["Take", "take"],
  ["Witness", "witness"],
  ["Pick", "pick"],
  ["Case", "case"],
  ["Qed", "qed"],
]);

const digestParsedUse = (use: UseOrHide, location: SourceLocation): UseDigest => ({
  kind: use.kind === "Use" ? "use" : "hide",
  range: formatRange(location),
  only: use.isOnly,
  facts: use.facts.map(getFactDigest),
  defs: use.defs.map(getDefName),
});

const digestParsedProof = (proof: Proof | undefined): ProofDigest | undefined => {
  if (proof === undefined) return undefined;
  const range = formatRange(proof.location);
  if (proof.kind === "Obvious" || proof.kind === "Omitted") {
    return { kind: proof.kind === "Obvious" ? "obvious" : "omitted", range };
  }
  if (proof.kind === "By") {
    return {
      kind: "by",
      range,
      only: proof.isOnly,
      facts: proof.facts.map(getFactDigest),
      defs: proof.defs.map(getDefName),
    };
  }
  return { kind: "steps", range, level: proof.level, steps: proof.steps.map(digestParsedStep) };
};

const digestParsedStep = (step: ProofStep): StepDigest => {
  const body = step.body;
  const range = formatRange(step.location);
  if (body.kind === "Use" || body.kind === "Hide") return digestParsedUse(body, step.location);
  if (body.kind === "Instance") return { kind: "instance", range };
  if (body.kind === "Define") {
    return {
      kind: "define",
      range: formatRange(body.location),
      names: body.definitions.map((definition) => definition.name ?? ""),
    };
  }
  const isSuffices =
    body.kind === "Assert" && body.isSuffices && body.statement.kind !== "AssumeProve";
  return {
    kind: STEP_DIGEST_KINDS.get(body.kind) ?? (isSuffices ? "suffices" : "assert"),
    name: step.name,
    range,
    proof: digestParsedProof(step.proof),
  };
};

const digestParsedTheorem = (theorem: Theorem): TheoremDigest => ({
  kind: "theorem",
  name: theorem.name,
  range: formatRange(theorem.location),
  proof: digestParsedProof(theorem.proof),
});

// The same digest of a module that tla-ts parsed.
export const digestParsed = (module: Module): ModuleDigest => ({
  name: module.name,
  units: [
    ...module.theorems.map(digestParsedTheorem),
    ...module.uses.map((use) => digestParsedUse(use, use.location)),
  ],
  modules: module.modules.map(digestParsed),
});
