(*---
description: "Ported from SANY's semantic corpus: ExceptTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/ExceptTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
---------------------------- MODULE ExceptTest ------------------------------
EXTENDS Semantics
CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

(* ID: f *)
f[(* ID: f!x *) x \in {1,2,3,4,5}] == x
THEOREM RefersTo(f, "f")
THEOREM IsLevel(f, ConstantLevel)
(* ID: r *)
r == [
  x : BOOLEAN,
  y : BOOLEAN
]
THEOREM RefersTo(r, "r")
THEOREM IsLevel(r, ConstantLevel)

(* ID: BasicExcept *)
BasicExcept == [RefersTo(f, "f") EXCEPT ![1] = 0]
THEOREM RefersTo(BasicExcept, "BasicExcept")
THEOREM IsLevel(BasicExcept, ConstantLevel)

(* ID: MultipleExcept *)
MultipleExcept == [
    RefersTo(f, "f") EXCEPT
      ![RefersTo(v, "v")] = RefersTo(c, "c"),
      ![2] = 1
  ]
THEOREM RefersTo(MultipleExcept, "MultipleExcept")
THEOREM IsLevel(MultipleExcept, VariableLevel)

(* ID: RecordExcept *)
RecordExcept == [
    RefersTo(r, "r") EXCEPT
      !.x = @,
      !.y = ~@
  ]
THEOREM RefersTo(RecordExcept, "RecordExcept")
THEOREM IsLevel(RecordExcept, ConstantLevel)

(* ID: NestedExcept *)
NestedExcept == [
    RefersTo(r, "r") EXCEPT
      !.x[RefersTo(v, "v")].y = RefersTo(c, "c"),
      ![RefersTo(c, "c")].x[RefersTo(v, "v")] = v'
  ]
THEOREM RefersTo(NestedExcept, "NestedExcept")
THEOREM IsLevel(NestedExcept, ActionLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file ExceptTest
    | In module ExceptTest
    | Cannot find source file for module Semantics imported in module ExceptTest.
    | *** Errors: 1
    | In module ExceptTest
    | Cannot find source file for module Semantics imported in module ExceptTest.
    3002:1 Parsing or semantic analysis failed.
---*)
