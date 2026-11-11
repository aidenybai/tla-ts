// Ported from Isabelle2025's Pure/goal.ML, Pure/Isar/method.ML and Pure/Isar/proof.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { compIncr, forallIntrVars, protectI, revcutRl } from "../pure/drule";
import { normHhf } from "../pure/simplifier";
import { mkVar, propT } from "../pure/term";
import { every, type Tactic } from "../pure/tactical";
import type { Limits } from "../pure/interrupt";
import { resolveTac } from "../pure/tactic";
import { assume, instantiate, type Thm } from "../pure/thm";
import type { Statement } from "./statement";

export const initGoal = (statement: Statement) =>
  instantiate([{ variable: mkVar("A", 0, propT), term: statement.conclusion }], protectI);

export const getFacts = (limits: Limits, statement: Statement) =>
  statement.assumptions.map((assumption) => normHhf(limits, assume(assumption)));

export const insertTac = (limits: Limits, facts: readonly Thm[], index: number): Tactic =>
  every(facts.map((fact) => resolveTac(limits, [compIncr(forallIntrVars(fact), revcutRl)])(index)));
