(*---
description: SANY reports E4337. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4337_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Parameterized labels must be given the correct number of arguments.
---- MODULE E4337_Test ----
op == \A x \in {} : lbl(x) :: TRUE
op2 == op!lbl(0, 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 11 to line 11, col 13 of module E4337_Test
    | Label `lbl' used with wrong number of arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
