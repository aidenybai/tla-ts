(*---
description: "Ported from SANY's semantic corpus: InnerModuleTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/InnerModuleTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
-------------------------- MODULE InnerModuleTest ---------------------------
EXTENDS Semantics

-----------------------------------------------------------------------------

--------------------------- MODULE Inner ----------------------------
(* ID: 1 *)
op == TRUE
=====================================================================

-----------------------------------------------------------------------------

inner == INSTANCE Inner
THEOREM RefersTo(inner!op, "1")
THEOREM IsLevel(inner!op, ConstantLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file InnerModuleTest
    | In module InnerModuleTest
    | Cannot find source file for module Semantics imported in module InnerModuleTest.
    | *** Errors: 1
    | In module InnerModuleTest
    | Cannot find source file for module Semantics imported in module InnerModuleTest.
    3002:1 Parsing or semantic analysis failed.
---*)
