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
  const digestModule = (module: XmlElement): ModuleDigest => ({
    name: getText(getChild(module, "uniquename")),
    units: module.children.flatMap((child) => {
      if (child.name === "TheoremNodeRef") return [digestTheorem(resolve(child), false)];
      if (child.name === "UseOrHideNode") return [digestUse(child)];
      return [];
    }),
    modules: getChildren(module, "ModuleNodeRef")
      .map(resolve)
      .filter((nested) => getText(getChild(nested, "uniquename")) !== moduleName)
      .map(digestModule),
  });
  const root = [...entries.values()].find(
    (node) => node.name === "ModuleNode" && getText(getChild(node, "uniquename")) === moduleName,
  );
  if (!root) throw new Error(`SANY's XML has no module ${moduleName}`);
  return digestModule(root);
};
