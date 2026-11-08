// A port of tlapm's Module.Elab: normalization anonymizes a module unit by unit and expands each
// instance into the units of the module it instantiates.

import { TlaProofError, TlapmBugError } from "../errors";
import { lambdify } from "./action";
import type { Anonymizer } from "./anonymize";
import { checkEnabledAxioms } from "./enabled-axioms";
import { isEqualHyp } from "./equality";
import {
  adjoinAll,
  at,
  exprifySequent,
  findNamed,
  getAtPrefix,
  getFact,
  getFresh,
  getLocationText,
  getLocusPrefix,
  getScopeHyps,
  mapAccumulate,
  type Defn,
  type Expr,
  type InstanceDefinition,
  type Locus,
  type Scope,
  type Sequent,
  type Warn,
} from "./expression";
import {
  bindTheoremName,
  compareNames,
  getHypSize,
  getUnitHyps,
  substituteUnits,
  type ModuleUnit,
  type Mule,
} from "./module";
import { getUnique, type Counter, type Proof } from "./proof";
import type { createSimplifier } from "./simplify";
import {
  consAll,
  consSubstitution,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  substituteSequent,
  type Substitution,
} from "./substitution";
import { getScopeTime } from "./temporal";

// latestModules is the module context of the latest anonymization of an axiom, theorem or USE,
// which tlapm's anonymizer keeps using for the instances inside later definitions.
export interface Pipeline {
  anonymizer: Anonymizer;
  simplify: ReturnType<typeof createSimplifier>;
  salts: Counter;
  latestModules: Map<string, Mule>;
  onWarning: Warn;
}

const lambdifyTheorem = (
  pipeline: Pipeline,
  scope: Scope | undefined,
  name: string | undefined,
  sequent: Sequent,
) => {
  try {
    const lambdified = lambdify(pipeline.anonymizer, pipeline.onWarning, scope, {
      kind: "Sequent",
      sequent,
    });
    if (lambdified.kind !== "Sequent") throw new TlapmBugError();
    return lambdified.sequent;
  } catch (error) {
    if (!(error instanceof TlaProofError) || error.failure === undefined) throw error;
    const location = sequent.active.location;
    const message = `${error.failure}\nCould not instantiate the theorem ${name === undefined ? "" : `named: ${name}, `}at: ${getLocationText(location)}`;
    pipeline.onWarning({ text: `${getAtPrefix(location)}[ERROR]${message}`, channel: "stdout" });
    pipeline.onWarning({ text: message, channel: "toolboxOnly" });
    return { context: [], active: at({ kind: "Internal", builtin: "TRUE" }, sequent.active) };
  }
};

const lambdifyUnit = (pipeline: Pipeline, scope: Scope | undefined, unit: ModuleUnit) => {
  if (unit.kind === "Theorem") {
    return { ...unit, sequent: lambdifyTheorem(pipeline, scope, unit.name, unit.sequent) };
  }
  if (unit.kind !== "Definition") return unit;
  const definition = unit.definition;
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma") return unit;
  const body = lambdify(pipeline.anonymizer, pipeline.onWarning, scope, definition.body);
  return { ...unit, definition: { ...definition, body } };
};

// lambdify_enabled_cdot: the ENABLED and \cdot of each definition and theorem statement bind
// their variables before instantiation substitutes for them. A theorem that cannot be lambdified
// states TRUE.
const lambdifyUnits = (
  pipeline: Pipeline,
  scope: Scope | undefined,
  units: ModuleUnit[],
): [Scope | undefined, ModuleUnit[]] =>
  mapAccumulate(scope, units, (current, unit): [Scope | undefined, ModuleUnit] => {
    if (unit.kind === "Submod") {
      const [inner, body] = lambdifyUnits(pipeline, current, unit.module.body);
      return [inner, { ...unit, module: { ...unit.module, body } }];
    }
    const lambdified = lambdifyUnit(pipeline, current, unit);
    return [adjoinAll(current, getUnitHyps(lambdified)), lambdified];
  });

// apply_subst: each parameter declaration of the instancee gives way to its substitute.
const applyParameters = (units: ModuleUnit[], substitutes: Map<string, Expr>) => {
  const body: ModuleUnit[] = [];
  let size = 0;
  let rest = units;
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    const split =
      unit.kind === "Constants"
        ? {
            name: unit.declarations[0].name,
            remaining: { ...unit, declarations: unit.declarations.slice(1) },
          }
        : unit.kind === "Variables"
          ? { name: unit.names[0], remaining: { ...unit, names: unit.names.slice(1) } }
          : undefined;
    if (split) {
      const substitute = substitutes.get(split.name);
      if (!substitute) throw new TlaProofError(`Parameter ${split.name} has no substitute`);
      const isEmpty = getHypSize(split.remaining) === 0;
      rest = substituteUnits(
        consSubstitution(shiftExpr(size, substitute), shift(0)),
        isEmpty ? tail : [split.remaining, ...tail],
      );
      continue;
    }
    body.push(unit);
    size += getHypSize(unit);
    rest = tail;
  }
  return body;
};

// resub_for: references to the instancee's own units become applications to the instance
// arguments, which the definitions now bind themselves.
const getLocalSubstitution = (
  count: number,
  argumentCount: number,
  location: Locus | undefined,
): Substitution => {
  const args = Array.from({ length: argumentCount }, (_item, index) =>
    at({ kind: "Ix", index: argumentCount - index }, { location }),
  );
  const parameters = Array.from({ length: argumentCount }, (_item, index) =>
    at({ kind: "Ix", index: index + 1 }, { location }),
  );
  const locals = Array.from({ length: count }, (_item, index): Expr => {
    const operator = at({ kind: "Ix", index: index + argumentCount + 1 }, { location });
    return argumentCount > 0 ? at({ kind: "Apply", operator, args }, { location }) : operator;
  });
  return consAll([...locals, ...parameters].reverse(), shift(count + argumentCount));
};

const addParameters = (expression: Expr, args: string[]): Expr => {
  const params = args.map((name) => ({ name, shape: 0 }));
  if (expression.kind === "Lambda")
    return { ...expression, params: [...params, ...expression.params] };
  return args.length === 0
    ? expression
    : at({ kind: "Lambda", params, body: expression }, expression);
};

// localize: names the instancee's units under the instance name, salting its local definitions, and
// abstracts each over the instance arguments.
const localize = (
  pipeline: Pipeline,
  units: ModuleUnit[],
  prefix: string,
  instance: InstanceDefinition,
  isLocal: boolean,
  location: Locus | undefined,
) => {
  const getLocalizedName = (name: string) => (prefix === "" ? name : `${prefix}!${name}`);
  const argumentCount = instance.args.length;
  const body: ModuleUnit[] = [];
  let size = 0;
  let rest = units;
  let isComplained = argumentCount === 0;
  const complain = (text: string) => {
    if (isComplained) return;
    isComplained = true;
    pipeline.onWarning({ text, channel: "stderr" });
  };
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    rest = tail;
    const localized = (expression: Expr) =>
      addParameters(
        substituteExpr(getLocalSubstitution(size, argumentCount, location), expression),
        instance.args,
      );
    switch (unit.kind) {
      case "Definition": {
        const definition = unit.definition;
        if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
          throw new TlaProofError("Module.Elab.localize");
        }
        const name = unit.isLocal
          ? `${definition.name}$${getUnique(pipeline.salts)}`
          : definition.name;
        body.push({
          ...unit,
          definition: {
            ...definition,
            name: getLocalizedName(name),
            body: localized(definition.body),
          },
          whereDefined: unit.isLocal ? "Builtin" : unit.whereDefined,
          isLocal: unit.isLocal || isLocal,
        });
        size += 1;
        continue;
      }
      case "Axiom": {
        complain(
          `${getLocusPrefix(location)}Instancing produces parametric axioms.\nSuch axioms will be forcibly hidden and cannot be cited.\n(This warning appears at-most once per INSTANCE declaration.)`,
        );
        const axiom: ModuleUnit = {
          ...unit,
          name: unit.name === undefined ? undefined : getLocalizedName(unit.name),
          expression: localized(unit.expression),
        };
        body.push(axiom);
        size += getHypSize(axiom);
        continue;
      }
      case "Theorem": {
        complain(
          `${getAtPrefix(location)}Warning: Instancing produces parametric theorems.\nSuch theorems will be forcibly hidden and cannot be cited.\n(This warning appears at-most once per INSTANCE declaration.)`,
        );
        const expression = localized(at(exprifySequent(unit.sequent), unit));
        body.push({
          ...unit,
          name: unit.name === undefined ? undefined : getLocalizedName(unit.name),
          sequent:
            expression.kind === "Sequent"
              ? expression.sequent
              : { context: [], active: expression },
          proof: { kind: "Omitted", omission: "Elsewhere", location: unit.location },
        });
        size += 1;
        continue;
      }
      case "Mutate":
        if (unit.mode === "Use") rest = substituteUnits(shift(-unit.usable.facts.length), rest);
        continue;
      case "Submod":
        continue;
      default:
        throw new TlaProofError("Module.Elab.localize");
    }
  }
  return body;
};

// localize_axioms: an axiom becomes a hypothesis of each theorem after it, and a named one also a
// definition.
const localizeAxioms = (units: ModuleUnit[]) => {
  const body: ModuleUnit[] = [];
  let rest = units;
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    if (unit.kind !== "Axiom") {
      body.push(unit);
      rest = tail;
      continue;
    }
    const location = unit.location;
    if (unit.name !== undefined) {
      body.push({
        kind: "Definition",
        definition: { kind: "Operator", name: unit.name, body: unit.expression, location },
        whereDefined: { kind: "Proof", time: "Always" },
        visibility: "Visible",
        isLocal: false,
        location,
      });
    }
    const hyp = getFact(
      unit.name === undefined ? shiftExpr(1, unit.expression) : at({ kind: "Ix", index: 2 }, unit),
      "Visible",
      "Always",
      location,
    );
    let distance = 0;
    const inserted = tail.map((next): ModuleUnit => {
      const size = distance;
      distance += getHypSize(next);
      if (next.kind !== "Theorem") return next;
      const sequent = substituteSequent(shift(1), next.sequent);
      return {
        ...next,
        sequent: { ...sequent, context: [substituteHyp(shift(size), hyp), ...sequent.context] },
        axiomCount: next.axiomCount + 1,
      };
    });
    rest = substituteUnits(shift(-1), inserted);
  }
  return body;
};

const getParameters = (module: Mule) =>
  new Set(
    module.body.flatMap((unit) =>
      unit.kind === "Constants"
        ? unit.declarations.map((declaration) => declaration.name)
        : unit.kind === "Variables"
          ? unit.names
          : [],
    ),
  );

// Module.Elab.instantiate: the units of an instantiated module, in the context of the instance.
const instantiate = (
  pipeline: Pipeline,
  modules: Map<string, Mule>,
  scope: Scope | undefined,
  instance: InstanceDefinition,
  isLocal: boolean,
  prefix: string,
  location: Locus | undefined,
) => {
  const module = modules.get(instance.module);
  if (!module) throw new TlaProofError(`Module "${instance.module}" unknown`);
  const parameters = getParameters(module);
  for (const substitution of instance.substitutions) {
    if (!parameters.has(substitution.name)) {
      throw new TlaProofError(
        `Parameter ${substitution.name} occurs in the statement \`INSTANCE ${instance.module} WITH\`, and is not declared in the module ${instance.module}`,
      );
    }
  }
  const instanceScope = adjoinAll(
    scope,
    instance.args.map((name) => getFresh(name, "Unknown")),
  );
  const substitutes = new Map(
    instance.substitutions.map((entry) => [entry.name, entry.expression]),
  );
  for (const name of [...parameters].sort(compareNames)) {
    if (substitutes.has(name)) continue;
    if (!findNamed(instanceScope, name)) {
      const message = `Required parameter ${name} for module ${instance.module} could not be inferred.`;
      pipeline.onWarning({
        text: `${getLocusPrefix(instance.location)}${message}\n`,
        channel: "toolbox",
      });
      throw new TlaProofError(message, { failure: "Module.Elab.complete_with_statement_params" });
    }
    substitutes.set(name, at({ kind: "Opaque", name }, { location }));
  }
  const anonymized = new Map(
    [...substitutes].map(([name, expression]) => [
      name,
      pipeline.anonymizer.expr(instanceScope, expression),
    ]),
  );
  const body = substituteUnits(
    shift((instanceScope?.size ?? 0) - (module.depth ?? 0)),
    module.body.map((unit): ModuleUnit =>
      unit.kind === "Theorem"
        ? {
            ...unit,
            proof: { kind: "Omitted", omission: "Implicit", location: unit.proof.location },
          }
        : unit,
    ),
  );
  const [, lambdified] = lambdifyUnits(pipeline, instanceScope, body);
  return localizeAxioms(
    localize(
      pipeline,
      applyParameters(lambdified, anonymized),
      prefix,
      instance,
      isLocal,
      location,
    ),
  );
};

// make_defs: the definitions among the units an INSTANCE inside a LET or DEFINE stands for.
export const expandInstance = (
  pipeline: Pipeline,
  scope: Scope | undefined,
  definition: Extract<Defn, { kind: "Instance" }>,
): Defn[] => {
  const name = definition.instance.module;
  if (!pipeline.latestModules.has(name)) {
    pipeline.onWarning({
      text: `${getLocusPrefix(definition.instance.location)}Module ${JSON.stringify(name)} unknown\n`,
      channel: "toolbox",
    });
    throw new TlaProofError(`Module ${JSON.stringify(name)} unknown`, {
      failure: "Module.Elab.anon#defns",
    });
  }
  const units = instantiate(
    pipeline,
    pipeline.latestModules,
    scope,
    definition.instance,
    true,
    definition.name,
    definition.location,
  );
  const definitions: Defn[] = [];
  let rest = units;
  while (rest.length > 0) {
    const [unit, ...tail] = rest;
    if (unit.kind !== "Definition") {
      rest = substituteUnits(shift(-getHypSize(unit)), tail);
      continue;
    }
    definitions.push(unit.definition);
    rest = tail;
  }
  return definitions;
};

// Module.Elab.normalize: anonymizes each unit in the context of the ones before it, expands
// instances, merges repeated definitions, and simplifies the proofs of important modules. The
// result also joins the modules that later instances can name.
export const normalize = (
  pipeline: Pipeline,
  modules: Map<string, Mule>,
  scope: Scope | undefined,
  module: Mule,
): Mule => {
  const body: ModuleUnit[] = [];
  let current = scope;
  const emit = (unit: ModuleUnit) => {
    body.push(unit);
    current = adjoinAll(current, getUnitHyps(unit));
  };
  const isRedundant = (name: string | undefined) =>
    name !== undefined && findNamed(current, name) !== undefined;
  // Instantiated units arrive anonymized.
  const queue = module.body.map((unit) => ({ unit, isAnonymized: false }));
  for (let index = 0; index < queue.length; index++) {
    const unit = queue[index].unit;
    const expand = (instance: InstanceDefinition, isLocal: boolean, prefix: string) => {
      const units = instantiate(
        pipeline,
        modules,
        current,
        instance,
        isLocal,
        prefix,
        unit.location,
      );
      queue.splice(index + 1, 0, ...units.map((inner) => ({ unit: inner, isAnonymized: true })));
    };
    switch (unit.kind) {
      case "Anoninst":
        expand(unit.instance, unit.isLocal, "");
        continue;
      case "Definition": {
        const definition = unit.definition;
        if (definition.kind === "Instance") {
          expand(definition.instance, unit.isLocal, definition.name);
          continue;
        }
        const anonymized =
          definition.kind === "Recursive" || queue[index].isAnonymized
            ? definition
            : pipeline.anonymizer.defn(current, definition);
        const normalized: ModuleUnit = { ...unit, definition: anonymized };
        if (definition.kind === "Recursive") {
          emit(normalized);
          continue;
        }
        const hyp = getUnitHyps(normalized)[0];
        const found = findNamed(current, definition.name);
        if (found?.hyp.kind === "Defn") {
          const isMerged =
            found.hyp.definition.kind === "Recursive" ||
            isEqualHyp(substituteHyp(shift(found.depth + 1), found.hyp), hyp);
          if (isMerged) {
            const rest = queue.slice(index + 1);
            const substituted = substituteUnits(
              consSubstitution(at({ kind: "Ix", index: found.depth + 1 }, unit), shift(0)),
              rest.map((entry) => entry.unit),
            );
            queue.splice(
              index + 1,
              rest.length,
              ...rest.map((entry, offset) => ({ ...entry, unit: substituted[offset] })),
            );
            continue;
          }
        }
        emit(normalized);
        continue;
      }
      case "Recursives":
      case "Constants":
      case "Variables":
        emit(unit);
        continue;
      case "Axiom":
        if (isRedundant(unit.name)) continue;
        pipeline.latestModules = new Map(modules);
        emit({ ...unit, expression: pipeline.anonymizer.expr(current, unit.expression) });
        continue;
      case "Theorem": {
        const isDuplicate = isRedundant(unit.name);
        const name = isDuplicate ? `(redundant)${unit.name}` : unit.name;
        const proof: Proof = isDuplicate
          ? { kind: "Obvious", location: unit.proof.location }
          : unit.proof;
        pipeline.latestModules = new Map(modules);
        const sequent = pipeline.anonymizer.sequent(current, unit.sequent);
        const binding = bindTheoremName(name, sequent, unit.location);
        const proofScope = adjoinAll(
          adjoinAll(
            current,
            binding.hyps.map((hyp) => ({ ...hyp, isConstnessUnset: true })),
          ),
          binding.sequent.context,
        );
        const anonymized = pipeline.anonymizer.proof(proofScope, proof);
        const proofContext = getScopeHyps(proofScope);
        const simplified = module.isImportant
          ? checkEnabledAxioms(
              proofContext,
              pipeline.simplify(
                proofContext,
                binding.sequent.active,
                anonymized,
                getScopeTime(binding.sequent.context, "Always"),
              ),
              pipeline.onWarning,
            )
          : anonymized;
        emit({ ...unit, name, sequent, proof: simplified });
        continue;
      }
      case "Mutate":
        pipeline.latestModules = new Map(modules);
        emit({ ...unit, usable: pipeline.anonymizer.usable(current, unit.usable) });
        continue;
      case "Submod":
        emit({ ...unit, module: normalize(pipeline, modules, current, unit.module) });
        continue;
    }
  }
  const normalized = { ...module, body, depth: scope?.size ?? 0 };
  modules.set(module.name, normalized);
  return normalized;
};
