(*---
description: SANY reports E4275. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4275_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
This error is caused by providing a LAMBDA as an argument to an operator when
an expression is required.
---- MODULE E4275_Test ----
op(x) == 0
op2 == op(LAMBDA x : 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 11 to line 12, col 22 of module E4275_Test
    | LAMBDA expression used where an expression is required.
    3002:1 Parsing or semantic analysis failed.
---*)
