(*---
description: Jlist Inside Function Set. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/functions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_jlist_inside_function_set ----
op == [
  /\ A
  /\ B
  /\ C
    ->
      /\ D
      /\ E
      /\ F
        ]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 6
    | line 10, col 6 to line 10, col 6 of module functions_jlist_inside_function_set
    | Unknown operator: `A'.
    | line 11, col 6 to line 11, col 6 of module functions_jlist_inside_function_set
    | Unknown operator: `B'.
    | line 12, col 6 to line 12, col 6 of module functions_jlist_inside_function_set
    | Unknown operator: `C'.
    | line 14, col 10 to line 14, col 10 of module functions_jlist_inside_function_set
    | Unknown operator: `D'.
    | line 15, col 10 to line 15, col 10 of module functions_jlist_inside_function_set
    | Unknown operator: `E'.
    | line 16, col 10 to line 16, col 10 of module functions_jlist_inside_function_set
    | Unknown operator: `F'.
    3002:1 Parsing or semantic analysis failed.
---*)
