(*---
description: "Ported from SANY's semantic corpus: StepExpressionsTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/StepExpressionsTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
------------------------ MODULE StepExpressionsTest -------------------------
EXTENDS Semantics

CONSTANT (* ID: c *) c
VARIABLES (* ID: v *) v

THEOREM IsLevel([RefersTo(c, "c")]_<<RefersTo(v, "v")>>, ActionLevel)
THEOREM IsLevel([RefersTo(v, "v")']_<<RefersTo(v, "v")>>, ActionLevel)
THEOREM IsLevel(<<RefersTo(c, "c")>>_<<RefersTo(v, "v")>>, ActionLevel)
THEOREM IsLevel(<<RefersTo(v, "v")'>>_<<RefersTo(v, "v")>>, ActionLevel)
THEOREM IsLevel([][RefersTo(c, "c")]_<<RefersTo(v, "v")>>, TemporalLevel)
THEOREM IsLevel([][RefersTo(v, "v")']_<<RefersTo(v, "v")>>, TemporalLevel)
THEOREM IsLevel(<><<RefersTo(c, "c")>>_<<RefersTo(v, "v")>>, TemporalLevel)
THEOREM IsLevel(<><<RefersTo(v, "v")'>>_<<RefersTo(v, "v")>>, TemporalLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file StepExpressionsTest
    | In module StepExpressionsTest
    | Cannot find source file for module Semantics imported in module StepExpressionsTest.
    | *** Errors: 1
    | In module StepExpressionsTest
    | Cannot find source file for module Semantics imported in module StepExpressionsTest.
    3002:1 Parsing or semantic analysis failed.
---*)
