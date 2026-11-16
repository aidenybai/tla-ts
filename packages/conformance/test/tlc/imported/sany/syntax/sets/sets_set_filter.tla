(*---
description: Set Filter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_filter ----
op == {x \in Nat : P(x)}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 14 to line 9, col 16 of module sets_set_filter
    | Unknown operator: `Nat'.
    | line 9, col 20 to line 9, col 20 of module sets_set_filter
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)
