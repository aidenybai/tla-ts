(*---
description: One element past the capped capacity fails.
ref: tlc2/value/impl/ValueVec.java#ensureCapacity
outcome: evaluation-failure
config: ""
args:
  - -maxSetSize
  - "20"
---*)
---- MODULE filter_one_past_bound_after_growth ----
EXTENDS Naturals, TLC, FiniteSets
ASSUME PrintT(Cardinality({e \in 1..21 : TRUE}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 48 of module filter_one_past_bound_after_growth failed.
    Attempted to construct a set with too many elements (>20).
---*)
