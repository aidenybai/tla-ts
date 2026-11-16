(*---
description: CASE Arms Across Nested Disjunction and Conjunction Lists. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/case.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE case_case_arms_across_nested_disjunction_and_conjunction_lists ----
op ==
  CASE A ->
    \/ CASE B ->
        /\ CASE C -> D
           [] E -> F
      [] G -> H
  [] I -> K
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 10
    | line 10, col 8 to line 10, col 8 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `A'.
    | line 11, col 13 to line 11, col 13 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `B'.
    | line 12, col 17 to line 12, col 17 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `C'.
    | line 12, col 22 to line 12, col 22 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `D'.
    | line 13, col 15 to line 13, col 15 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `E'.
    | line 13, col 20 to line 13, col 20 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `F'.
    | line 14, col 10 to line 14, col 10 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `G'.
    | line 14, col 15 to line 14, col 15 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `H'.
    | line 15, col 6 to line 15, col 6 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `I'.
    | line 15, col 11 to line 15, col 11 of module case_case_arms_across_nested_disjunction_and_conjunction_lists
    | Unknown operator: `K'.
    3002:1 Parsing or semantic analysis failed.
---*)
