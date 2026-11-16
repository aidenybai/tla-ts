(*---
description: LAMBDA Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_lambda_parameter ----
op == f(LAMBDA x, y : x + y, LAMBDA x : 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module operators_lambda_parameter
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)
