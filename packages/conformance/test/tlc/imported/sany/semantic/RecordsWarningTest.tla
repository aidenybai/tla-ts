(*---
description: "Ported from SANY's semantic corpus: RecordsWarningTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/RecordsWarningTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
--------------------------- MODULE RecordsWarningTest ------------------------------
EXTENDS Semantics

CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

Init ==
  [ c |-> 42, frob |-> "hello" ]

Next ==
  [ frob |-> "world", c |-> v' ]

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file RecordsWarningTest
    | In module RecordsWarningTest
    | Cannot find source file for module Semantics imported in module RecordsWarningTest.
    | *** Errors: 1
    | In module RecordsWarningTest
    | Cannot find source file for module Semantics imported in module RecordsWarningTest.
    3002:1 Parsing or semantic analysis failed.
---*)
