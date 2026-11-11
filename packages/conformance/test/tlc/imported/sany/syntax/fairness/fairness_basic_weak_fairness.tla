(*---
description: Basic Weak Fairness. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/fairness.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE fairness_basic_weak_fairness ----
op == WF_(vars)(x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 11 to line 9, col 14 of module fairness_basic_weak_fairness
    | Unknown operator: `vars'.
    | line 9, col 17 to line 9, col 17 of module fairness_basic_weak_fairness
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
