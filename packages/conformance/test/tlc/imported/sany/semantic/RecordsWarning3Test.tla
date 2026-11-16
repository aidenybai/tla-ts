(*---
description: "Ported from SANY's semantic corpus: RecordsWarning3Test.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/RecordsWarning3Test.tla
features:
  - sany-semantic
outcome: parse-error
---*)
--------------------------- MODULE RecordsWarning3Test ------------------------------
EXTENDS Semantics, Integers

CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

Next ==
  [c : {"tok"}, q : Int ]

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file RecordsWarning3Test
    | In module RecordsWarning3Test
    | Cannot find source file for module Semantics imported in module RecordsWarning3Test.
    | *** Errors: 1
    | In module RecordsWarning3Test
    | Cannot find source file for module Semantics imported in module RecordsWarning3Test.
    3002:1 Parsing or semantic analysis failed.
---*)
