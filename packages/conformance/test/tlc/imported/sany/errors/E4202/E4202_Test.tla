(*---
description: SANY reports E4202. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4202_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Built-in operators cannot be redefined.
---- MODULE E4202_Test ----
TRUE == FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 1 to line 10, col 13 of module E4202_Test
    | Operator TRUE already defined or declared.
    | line 10, col 1 to line 10, col 13 of module E4202_Test
    | Symbol TRUE is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
