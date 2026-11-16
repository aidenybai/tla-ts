(*---
description: Function Evaluation. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/functions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_function_evaluation ----
op == f[1,2,3]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module functions_function_evaluation
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)
