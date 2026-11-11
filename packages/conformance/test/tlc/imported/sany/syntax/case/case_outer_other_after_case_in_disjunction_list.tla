(*---
description: Outer OTHER After CASE in Disjunction List. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/case.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE case_outer_other_after_case_in_disjunction_list ----
op ==
  CASE A ->
    \/ CASE B -> C
       [] D -> E
  [] OTHER -> G
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 6
    | line 10, col 8 to line 10, col 8 of module case_outer_other_after_case_in_disjunction_list
    | Unknown operator: `A'.
    | line 11, col 13 to line 11, col 13 of module case_outer_other_after_case_in_disjunction_list
    | Unknown operator: `B'.
    | line 11, col 18 to line 11, col 18 of module case_outer_other_after_case_in_disjunction_list
    | Unknown operator: `C'.
    | line 12, col 11 to line 12, col 11 of module case_outer_other_after_case_in_disjunction_list
    | Unknown operator: `D'.
    | line 12, col 16 to line 12, col 16 of module case_outer_other_after_case_in_disjunction_list
    | Unknown operator: `E'.
    | line 13, col 15 to line 13, col 15 of module case_outer_other_after_case_in_disjunction_list
    | Unknown operator: `G'.
    3002:1 Parsing or semantic analysis failed.
---*)
