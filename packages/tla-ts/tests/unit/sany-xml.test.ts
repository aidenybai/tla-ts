import { describe, expect, it } from "vite-plus/test";
import { generateSanySpecification } from "../../src/sany-generator";
import { checkModuleLevels } from "../../src/sany-levels";
import { SANY_STANDARD_MODULES } from "../../src/sany-modules";
import { getDeclarations, getOpDefs, type ModuleNode } from "../../src/sany-nodes";
import { exportSanyXml } from "../../src/sany-xml";

const COUNTER_STEPS = `---- MODULE CounterSteps ----
EXTENDS Naturals
CONSTANT Limit
VARIABLE count
Step == count < Limit /\\ count' = count + 1
====`;

const SPEC = `---- MODULE Spec ----
EXTENDS Naturals
CONSTANTS N, F(_)
VARIABLES x, y
\\* The first state.
Init == x = 0 /\\ y = N
Next == x' = x + 1 /\\ UNCHANGED y
Spec == Init /\\ [][Next]_<<x, y>>
Same(a) == a
Primed(a) == a'
Sum(a, b) == LET Twice(c) == c + c IN Twice(a) + b
Steps == INSTANCE CounterSteps WITH Limit <- N, count <- x
====`;

const loadModule = (name: string) =>
  name === "CounterSteps" ? COUNTER_STEPS : SANY_STANDARD_MODULES.get(name);

const generate = () => {
  const specification = generateSanySpecification(SPEC, loadModule);
  specification.modules.forEach((module) => checkModuleLevels(module));
  return specification;
};

const getDefinition = (module: ModuleNode, name: string) => {
  const definition = getOpDefs(module).find((candidate) => candidate.name === name);
  if (definition === undefined) throw new Error(`No definition ${name}`);
  return definition;
};

describe("SANY XML export", () => {
  it("analyzes modules after the modules they extend and instantiate", () => {
    expect(generate().modules.map((module) => module.name)).toEqual([
      "Naturals",
      "CounterSteps",
      "Spec",
    ]);
  });

  it("declares constants and variables with SANY's kinds, levels and arities", () => {
    const root = generate().root;
    expect(
      [...getDeclarations(root, 2), ...getDeclarations(root, 3)].map((declaration) => [
        declaration.name,
        declaration.declKind,
        declaration.level,
        declaration.arity,
      ]),
    ).toEqual([
      ["F", 2, 0, 1],
      ["N", 2, 0, 0],
      ["x", 3, 1, 0],
      ["y", 3, 1, 0],
    ]);
  });

  it("computes the level of every definition", () => {
    const root = generate().root;
    expect(
      ["Init", "Next", "Spec", "Same", "Primed", "Sum"].map(
        (name) => getDefinition(root, name).level,
      ),
    ).toEqual([1, 2, 3, 0, 2, 0]);
  });

  it("marks a primed parameter as not Leibniz", () => {
    const root = generate().root;
    expect(getDefinition(root, "Same").isLeibnizArg).toEqual([true]);
    expect(getDefinition(root, "Primed").isLeibnizArg).toEqual([false]);
    expect(getDefinition(root, "Primed").weights).toEqual([0]);
  });

  it("keeps the definitions of a LET in its LetInNode", () => {
    const body = getDefinition(generate().root, "Sum").body;
    const letIn = body?.kind === "LetIn" ? body : undefined;
    expect(letIn?.opDefs.map((definition) => definition.name)).toEqual(["Twice"]);
    expect(letIn?.level).toBe(0);
    expect(letIn?.location).toEqual({
      file: "Spec",
      beginLine: 11,
      beginColumn: 14,
      endLine: 11,
      endColumn: 50,
    });
  });

  it("substitutes into the definitions of a named instance", () => {
    const root = generate().root;
    const step = getDefinition(root, "Steps!Step");
    expect(step.module).toBe(root);
    expect(step.source?.module?.name).toBe("CounterSteps");
    expect(step.body?.kind).toBe("SubstIn");
    expect(step.level).toBe(2);
    const substitutions = step.body?.kind === "SubstIn" ? step.body.substs : [];
    expect(substitutions.map((subst) => subst.op.name).toSorted()).toEqual(["Limit", "count"]);
  });

  it("prints the XML that SANY's XMLExporter prints", () => {
    const xml = exportSanyXml(SPEC, loadModule);
    const lines = xml.split("\n");
    expect(lines.slice(0, 3)).toEqual([
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
      "<modules>",
      "  <RootModule>Spec</RootModule>",
    ]);
    expect(xml).toContain("<pre-comments><![CDATA[\\* The first state.]]></pre-comments>");
    expect(xml.match(/<ModuleNodeRef>/g)?.length).toBeGreaterThanOrEqual(3);
    expect(lines.at(-1)).toBe("</modules>");
  });
});
