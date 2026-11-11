(*---
description: "Ported from SANY's semantic corpus: RecordsWarning2Test.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/RecordsWarning2Test.tla
features:
  - sany-semantic
outcome: parse-error
---*)
--------------------------- MODULE RecordsWarning2Test ------------------------------
EXTENDS Semantics

CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

Next ==
  [ c |-> v' ]

Init ==
  [ c |-> 42 ]

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file RecordsWarning2Test
    | In module RecordsWarning2Test
    | Cannot find source file for module Semantics imported in module RecordsWarning2Test.
    | *** Errors: 1
    | In module RecordsWarning2Test
    | Cannot find source file for module Semantics imported in module RecordsWarning2Test.
    3002:1 Parsing or semantic analysis failed.
---*)
