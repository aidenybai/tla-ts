(*---
description: "Ported from SANY's semantic corpus: ConjunctionListTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/ConjunctionListTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
----------------------- MODULE ConjunctionListTest --------------------------
EXTENDS Semantics
CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

(* ID: ConstantList *)
ConstantList ==
 /\ 1
 /\ 2
 /\ RefersTo(c, "c")
 /\ TRUE

ASSUME RefersTo(ConstantList, "ConstantList")
ASSUME IsLevel(ConstantList, ConstantLevel)

(* ID: VariableList *)
VariableList ==
 /\ RefersTo(v, "v")
 /\ c

THEOREM RefersTo(VariableList, "VariableList")
THEOREM IsLevel(VariableList, VariableLevel)

(* ID: ActionList *)
ActionList ==
 /\ c
 /\ v
 /\ v'

THEOREM RefersTo(ActionList, "ActionList")
THEOREM IsLevel(ActionList, ActionLevel)

(* ID: TemporalList *)
TemporalList ==
 /\ c
 /\ v
 /\ []v

THEOREM RefersTo(TemporalList, "TemporalList")
THEOREM IsLevel(TemporalList, TemporalLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file ConjunctionListTest
    | In module ConjunctionListTest
    | Cannot find source file for module Semantics imported in module ConjunctionListTest.
    | *** Errors: 1
    | In module ConjunctionListTest
    | Cannot find source file for module Semantics imported in module ConjunctionListTest.
    3002:1 Parsing or semantic analysis failed.
---*)
