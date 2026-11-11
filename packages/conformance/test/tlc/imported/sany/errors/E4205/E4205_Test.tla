(*---
description: SANY reports E4205. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4205_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
All built-in operators have level constraints, where their parameters should
not exceed a specific level. While there are many, many test cases that would
trigger this, the most fundamental is simply priming a primed expression.
---- MODULE E4205_Test ----
VARIABLE v
op == v''
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 7 to line 13, col 9 of module E4205_Test
    | Level error in applying operator ':
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
