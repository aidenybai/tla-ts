(*---
description: Function Set. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/functions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_function_set ----
op == [Nat -> [Nat -> Real]]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 8 to line 9, col 10 of module functions_function_set
    | Unknown operator: `Nat'.
    | line 9, col 16 to line 9, col 18 of module functions_function_set
    | Unknown operator: `Nat'.
    | line 9, col 23 to line 9, col 26 of module functions_function_set
    | Unknown operator: `Real'.
    3002:1 Parsing or semantic analysis failed.
---*)
