(*---
description: SANY reports E4270. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4270_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
This error is caused by providing an expression as an argument to an operator
when a higher-order operator is required.
---- MODULE E4270_Test ----
op(F(_)) == 0
op2 == op({})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 12, col 11 to line 12, col 12 of module E4270_Test
    | An expression appears as argument number 1 (counting from 1) to operator 'op', in a position an operator is required.
    | line 12, col 8 to line 12, col 13 of module E4270_Test
    | Argument number 1 to operator 'op' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
