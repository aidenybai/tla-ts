(*---
description: Set Filter with Jlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_filter_with_jlist ----
op == {
  x \in
    /\ A
    /\ B
    /\ C
      :
    /\ D
    /\ E
    /\ F
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 6
    | line 11, col 8 to line 11, col 8 of module sets_set_filter_with_jlist
    | Unknown operator: `A'.
    | line 12, col 8 to line 12, col 8 of module sets_set_filter_with_jlist
    | Unknown operator: `B'.
    | line 13, col 8 to line 13, col 8 of module sets_set_filter_with_jlist
    | Unknown operator: `C'.
    | line 15, col 8 to line 15, col 8 of module sets_set_filter_with_jlist
    | Unknown operator: `D'.
    | line 16, col 8 to line 16, col 8 of module sets_set_filter_with_jlist
    | Unknown operator: `E'.
    | line 17, col 8 to line 17, col 8 of module sets_set_filter_with_jlist
    | Unknown operator: `F'.
    3002:1 Parsing or semantic analysis failed.
---*)
