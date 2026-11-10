(*---
description: Mistaken Set Filter Test. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_mistaken_set_filter_test ----

op == {x \in Nat}
op == {x \in BOOLEAN, y \in STRING}

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 11, col 1 to line 11, col 35 of module sets_mistaken_set_filter_test
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 10, col 17 of module sets_mistaken_set_filter_test.
    | Semantic errors:
    | *** Errors: 5
    | line 10, col 8 to line 10, col 8 of module sets_mistaken_set_filter_test
    | Unknown operator: `x'.
    | line 10, col 14 to line 10, col 16 of module sets_mistaken_set_filter_test
    | Unknown operator: `Nat'.
    | line 11, col 1 to line 11, col 35 of module sets_mistaken_set_filter_test
    | Operator op already defined or declared.
    | line 11, col 8 to line 11, col 8 of module sets_mistaken_set_filter_test
    | Unknown operator: `x'.
    | line 11, col 23 to line 11, col 23 of module sets_mistaken_set_filter_test
    | Unknown operator: `y'.
    3002:1 Parsing or semantic analysis failed.
---*)
