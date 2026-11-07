(*---
description: Bounded CHOOSE. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_bounded_choose ----
op == CHOOSE x \in Nat : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 20 to line 9, col 22 of module quantification_bounded_choose
    | Unknown operator: `Nat'.
    3002:1 Parsing or semantic analysis failed.
---*)
