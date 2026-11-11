(*---
description: "Ported from SANY's semantic corpus: NegativeOpTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/NegativeOpTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
-------------------------- MODULE NegativeOpTest ----------------------------
EXTENDS Semantics

(* ID: op *)
op((* ID: op!-. *) -._) == RefersTo(-1, "op!-.")

CONSTANT (* ID: constant_negative *) -._
ASSUME RefersTo(-1, "constant_negative")

(* ID: -. *)
-. x == x
ASSUME RefersTo(-1, "-.")

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file NegativeOpTest
    | In module NegativeOpTest
    | Cannot find source file for module Semantics imported in module NegativeOpTest.
    | *** Errors: 1
    | In module NegativeOpTest
    | Cannot find source file for module Semantics imported in module NegativeOpTest.
    3002:1 Parsing or semantic analysis failed.
---*)
