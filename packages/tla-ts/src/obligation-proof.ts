// tlapm's proof IR (P_t).

import type { Bound, Defn, Expr, Locus, Sequent } from "./obligation-expression";

export type StepNumber =
  | { kind: "Named"; level: number; label: string; isAnonymous: boolean }
  | { kind: "Unnamed"; level: number; id: number };

export type UseDef = ({ kind: "Dvar"; name: string } | { kind: "Dx"; index: number }) & {
  location?: Locus;
};

export interface Usable {
  facts: Expr[];
  defs: UseDef[];
}

export type Omission = "Implicit" | "Explicit" | "Elsewhere";

export type ObligationKind =
  | { kind: "Main" }
  | { kind: "Support" }
  | { kind: "Error"; message: string }
  | { kind: "Omitted"; omission: Omission };

export interface Obligation {
  sequent: Sequent;
  location: Locus | undefined;
  kind: ObligationKind;
}

interface ProofProps {
  location?: Locus;
  step?: StepNumber;
  isSuppressed?: boolean;
  obligations?: Obligation[];
}

export type Proof = ProofCore & ProofProps;

export type ProofCore =
  | { kind: "Obvious" }
  | { kind: "Omitted"; omission: Omission }
  | { kind: "By"; usable: Usable; isOnly: boolean }
  | { kind: "Steps"; steps: Step[]; qed: QedStep }
  | { kind: "Error"; message: string };

export type QedStep = { proof: Proof } & ProofProps;

export type Step = StepCore & ProofProps;

export type StepCore =
  | { kind: "Hide"; usable: Usable }
  | { kind: "Define"; definitions: Defn[] }
  | { kind: "Assert"; sequent: Sequent; proof: Proof }
  | { kind: "Suffices"; sequent: Sequent; proof: Proof }
  | { kind: "Pcase"; expression: Expr; proof: Proof }
  | { kind: "Pick"; bounds: Bound[]; expression: Expr; proof: Proof }
  | { kind: "Use"; usable: Usable; isOnly: boolean }
  | { kind: "Have"; expression: Expr }
  | { kind: "Take"; bounds: Bound[] }
  | { kind: "Witness"; expressions: Expr[] }
  | { kind: "Forget"; count: number };

export const getStepName = (step: StepNumber) =>
  step.kind === "Named" ? `<${step.level}>${step.label}` : `<${step.level}>`;

// Std.unique: one counter for the whole run, shared by the parser, anonymization, and
// simplification, so anonymous step names match tlapm's.
export interface Counter {
  value: number;
}

export const getUnique = (counter: Counter) => ++counter.value;
