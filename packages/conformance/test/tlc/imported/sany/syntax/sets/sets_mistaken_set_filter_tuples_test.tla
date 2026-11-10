(*---
description: Mistaken Set Filter Tuples Test. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
  - tlc-bug
outcome: parse-error
correct:
  all:
    exit: 150
    transcript: |-
      | Semantic errors:
      | *** Errors: 3
      | line 24, col 10 to line 24, col 10 of module sets_mistaken_set_filter_tuples_test
      | Unknown operator: `x'.
      | line 24, col 13 to line 24, col 13 of module sets_mistaken_set_filter_tuples_test
      | Unknown operator: `y'.
      | line 24, col 21 to line 24, col 23 of module sets_mistaken_set_filter_tuples_test
      | Unknown operator: `Nat'.
      3002:1 Parsing or semantic analysis failed.
---*)
---- MODULE sets_mistaken_set_filter_tuples_test ----

op == {<<x, y>> \in Nat}

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 24, col 8 to line 24, col 15 of module sets_mistaken_set_filter_tuples_test
    | Unexpected token found.
    | line 24, col 8 to line 24, col 15 of module sets_mistaken_set_filter_tuples_test
    | Need name or step number here, not `N_IdentifierTuple'.
    | line 24, col 21 to line 24, col 23 of module sets_mistaken_set_filter_tuples_test
    | Unknown operator: `Nat'.
    3002:1 Parsing or semantic analysis failed.
---*)
