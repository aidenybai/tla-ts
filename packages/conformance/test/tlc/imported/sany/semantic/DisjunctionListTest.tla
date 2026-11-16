(*---
description: "Ported from SANY's semantic corpus: DisjunctionListTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/DisjunctionListTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
----------------------- MODULE DisjunctionListTest --------------------------
EXTENDS Semantics
CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

(* ID: ConstantList *)
ConstantList ==
 \/ 1
 \/ 2
 \/ RefersTo(c, "c")
 \/ TRUE

ASSUME RefersTo(ConstantList, "ConstantList")
ASSUME IsLevel(ConstantList, ConstantLevel)

(* ID: VariableList *)
VariableList ==
 \/ RefersTo(v, "v")
 \/ c

THEOREM RefersTo(VariableList, "VariableList")
THEOREM IsLevel(VariableList, VariableLevel)

(* ID: ActionList *)
ActionList ==
 \/ c
 \/ v
 \/ v'

THEOREM RefersTo(ActionList, "ActionList")
THEOREM IsLevel(ActionList, ActionLevel)

(* ID: TemporalList *)
TemporalList ==
 \/ c
 \/ v
 \/ []v

THEOREM RefersTo(TemporalList, "TemporalList")
THEOREM IsLevel(TemporalList, TemporalLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file DisjunctionListTest
    | In module DisjunctionListTest
    | Cannot find source file for module Semantics imported in module DisjunctionListTest.
    | *** Errors: 1
    | In module DisjunctionListTest
    | Cannot find source file for module Semantics imported in module DisjunctionListTest.
    3002:1 Parsing or semantic analysis failed.
---*)
