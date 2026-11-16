(*---
description: "Ported from SANY's semantic corpus: BasicTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/BasicTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
---------------------------- MODULE BasicTest -------------------------------
EXTENDS Semantics

(* ID: 1 *)
op == TRUE
THEOREM RefersTo(op, "1")
THEOREM IsLevel(op, ConstantLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file BasicTest
    | In module BasicTest
    | Cannot find source file for module Semantics imported in module BasicTest.
    | *** Errors: 1
    | In module BasicTest
    | Cannot find source file for module Semantics imported in module BasicTest.
    3002:1 Parsing or semantic analysis failed.
---*)
