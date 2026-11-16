(*---
description: Set Filter Precedence. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_filter_precedence ----
op == {x \in S : x \in T}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 14 to line 9, col 14 of module sets_set_filter_precedence
    | Unknown operator: `S'.
    | line 9, col 24 to line 9, col 24 of module sets_set_filter_precedence
    | Unknown operator: `T'.
    3002:1 Parsing or semantic analysis failed.
---*)
