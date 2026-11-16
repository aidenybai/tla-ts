(*---
description: Function Literal with Multiple Parameters and Jlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/functions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE functions_function_literal_with_multiple_parameters_and_jlist ----
op == [
  x, y \in Nat, <<a, b>> \in
    /\ A
    /\ B
      |->
        /\ A
        /\ B
            ]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 10, col 12 to line 10, col 14 of module functions_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `Nat'.
    | line 11, col 8 to line 11, col 8 of module functions_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `A'.
    | line 12, col 8 to line 12, col 8 of module functions_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `B'.
    | line 14, col 12 to line 14, col 12 of module functions_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `A'.
    | line 15, col 12 to line 15, col 12 of module functions_function_literal_with_multiple_parameters_and_jlist
    | Unknown operator: `B'.
    3002:1 Parsing or semantic analysis failed.
---*)
