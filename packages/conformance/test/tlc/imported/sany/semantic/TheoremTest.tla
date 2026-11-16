(*---
description: "Ported from SANY's semantic corpus: TheoremTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/TheoremTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
---------------------------- MODULE TheoremTest -----------------------------
EXTENDS Semantics

CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

(* ID: ConstantTheorem *)
THEOREM ConstantTheorem == RefersTo(c, "c")
THEOREM RefersTo(ConstantTheorem, "ConstantTheorem")
THEOREM IsLevel(ConstantTheorem, ConstantLevel)

(* ID: VariableTheorem *)
PROPOSITION VariableTheorem == RefersTo(v, "v")
THEOREM RefersTo(VariableTheorem, "VariableTheorem")
THEOREM IsLevel(VariableTheorem, VariableLevel)

(* ID: ActionTheorem *)
LEMMA ActionTheorem == RefersTo(v, "v")'
THEOREM RefersTo(ActionTheorem, "ActionTheorem")
THEOREM IsLevel(ActionTheorem, ActionLevel)

(* ID: TemporalTheorem *)
LEMMA TemporalTheorem == <>RefersTo(v, "v")
THEOREM RefersTo(TemporalTheorem, "TemporalTheorem")
THEOREM IsLevel(TemporalTheorem, TemporalLevel)

(* ID: MixedTheorem *)
COROLLARY MixedTheorem == [][RefersTo(c, "c")]_(RefersTo(v, "v"))
THEOREM RefersTo(MixedTheorem, "MixedTheorem")
THEOREM IsLevel(MixedTheorem, TemporalLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file TheoremTest
    | In module TheoremTest
    | Cannot find source file for module Semantics imported in module TheoremTest.
    | *** Errors: 1
    | In module TheoremTest
    | Cannot find source file for module Semantics imported in module TheoremTest.
    3002:1 Parsing or semantic analysis failed.
---*)
