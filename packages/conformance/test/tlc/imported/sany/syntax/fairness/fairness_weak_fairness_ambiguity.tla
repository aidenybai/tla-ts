(*---
description: Weak Fairness Ambiguity. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/fairness.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE fairness_weak_fairness_ambiguity ----
op == WF_vars(x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 10 to line 9, col 13 of module fairness_weak_fairness_ambiguity
    | Unknown operator: `vars'.
    | line 9, col 15 to line 9, col 15 of module fairness_weak_fairness_ambiguity
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
