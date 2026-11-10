(*---
description: "Ported from SANY's semantic corpus: AssumeTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/AssumeTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
---------------------------- MODULE AssumeTest ------------------------------
EXTENDS Semantics

(* ID: def *)
ASSUME def == TRUE
THEOREM RefersTo(def, "def")
THEOREM IsLevel(def, ConstantLevel)

(* ID: def2 *)
ASSUMPTION def2 == TRUE
THEOREM RefersTo(def2, "def2")
THEOREM IsLevel(def2, ConstantLevel)

(* ID: def3 *)
AXIOM def3 == TRUE
THEOREM RefersTo(def3, "def3")
THEOREM IsLevel(def3, ConstantLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file AssumeTest
    | In module AssumeTest
    | Cannot find source file for module Semantics imported in module AssumeTest.
    | *** Errors: 1
    | In module AssumeTest
    | Cannot find source file for module Semantics imported in module AssumeTest.
    3002:1 Parsing or semantic analysis failed.
---*)
