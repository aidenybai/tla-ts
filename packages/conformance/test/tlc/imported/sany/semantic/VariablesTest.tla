(*---
description: "Ported from SANY's semantic corpus: VariablesTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/VariablesTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
-------------------------- MODULE VariablesTest -----------------------------
EXTENDS Semantics
VARIABLES
  (* ID: x *) x,
  (* ID: y *) y,
  (* ID: z *) z

THEOREM RefersTo(x, "x")
THEOREM RefersTo(y, "y")
THEOREM RefersTo(z, "z")
THEOREM IsLevel(x, VariableLevel)
THEOREM IsLevel(y, VariableLevel)
THEOREM IsLevel(z, VariableLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file VariablesTest
    | In module VariablesTest
    | Cannot find source file for module Semantics imported in module VariablesTest.
    | *** Errors: 1
    | In module VariablesTest
    | Cannot find source file for module Semantics imported in module VariablesTest.
    3002:1 Parsing or semantic analysis failed.
---*)
