(*---
description: cap of model_value, a ModelValue, and union, a UnionValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE cap_model_value__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \cap (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module cap_model_value__union failed.
    Attempted to check if the value:
    1
    is an element of the model value mv
---*)
