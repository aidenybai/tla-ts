(*---
description: Bounded CHOOSE With Tuple. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_bounded_choose_with_tuple ----
op == CHOOSE <<x, y, z>> \in S : FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 30 to line 9, col 30 of module quantification_bounded_choose_with_tuple
    | Unknown operator: `S'.
    3002:1 Parsing or semantic analysis failed.
---*)
