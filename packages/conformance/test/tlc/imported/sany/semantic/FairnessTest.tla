(*---
description: "Ported from SANY's semantic corpus: FairnessTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/FairnessTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
--------------------------- MODULE FairnessTest -----------------------------
EXTENDS Semantics

VARIABLES (* ID: x *) x, (* ID: y *) y, (* ID: z*) z

(* ID: vars *)
vars == <<x, y, z>>

THEOREM IsLevel(WF_RefersTo(vars, "vars")(1), TemporalLevel)
THEOREM IsLevel(WF_<<RefersTo(x, "x"), RefersTo(y, "y"), RefersTo(z, "z")>>(1), TemporalLevel)
THEOREM IsLevel(SF_RefersTo(vars, "vars")(1), TemporalLevel)
THEOREM IsLevel(SF_<<RefersTo(x, "x"), RefersTo(y, "y"), RefersTo(z, "z")>>(1), TemporalLevel)

THEOREM IsLevel(WF_RefersTo(vars, "vars")(RefersTo(x, "x")), TemporalLevel)
THEOREM IsLevel(SF_RefersTo(vars, "vars")(RefersTo(y, "y")), TemporalLevel)

THEOREM IsLevel(WF_RefersTo(vars, "vars")(RefersTo(z, "z")'), TemporalLevel)
THEOREM IsLevel(SF_RefersTo(vars, "vars")(RefersTo(x, "x")'), TemporalLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file FairnessTest
    | In module FairnessTest
    | Cannot find source file for module Semantics imported in module FairnessTest.
    | *** Errors: 1
    | In module FairnessTest
    | Cannot find source file for module Semantics imported in module FairnessTest.
    3002:1 Parsing or semantic analysis failed.
---*)
