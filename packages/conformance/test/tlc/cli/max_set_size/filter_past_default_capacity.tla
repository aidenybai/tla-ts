(*---
description: The eleventh element asks a vector of capacity 10 to grow, which fails when the capacity is already past the bound.
ref: tlc2/value/impl/ValueVec.java#ensureCapacity
outcome: evaluation-failure
config: ""
args:
  - -maxSetSize
  - "5"
---*)
---- MODULE filter_past_default_capacity ----
EXTENDS Naturals, TLC, FiniteSets
ASSUME PrintT(Cardinality({e \in 1..11 : TRUE}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 48 of module filter_past_default_capacity failed.
    Attempted to construct a set with too many elements (>5).
---*)
