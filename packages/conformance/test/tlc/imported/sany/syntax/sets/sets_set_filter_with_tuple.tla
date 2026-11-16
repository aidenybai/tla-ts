(*---
description: Set Filter with Tuple. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_filter_with_tuple ----
op == {<<x, y, z>> \in Nat \X Int \X Real : P(x, y, z)}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 24 to line 9, col 26 of module sets_set_filter_with_tuple
    | Unknown operator: `Nat'.
    | line 9, col 31 to line 9, col 33 of module sets_set_filter_with_tuple
    | Unknown operator: `Int'.
    | line 9, col 38 to line 9, col 41 of module sets_set_filter_with_tuple
    | Unknown operator: `Real'.
    | line 9, col 45 to line 9, col 45 of module sets_set_filter_with_tuple
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)
