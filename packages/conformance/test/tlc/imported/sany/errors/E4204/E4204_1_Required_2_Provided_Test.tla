(*---
description: SANY reports E4204. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4204_1_Required_2_Provided_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Simple error. Calling an operator with the wrong number of arguments.
---- MODULE E4204_1_Required_2_Provided_Test ----
op(x) == 0
op2 == op(0, 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 10 to line 11, col 15 of module E4204_1_Required_2_Provided_Test
    | The operator op requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
