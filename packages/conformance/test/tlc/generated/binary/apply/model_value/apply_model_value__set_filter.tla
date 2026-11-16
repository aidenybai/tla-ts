(*---
description: apply of model_value, a ModelValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
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
---- MODULE apply_model_value__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv)[{x \in 1..3 : x > 1}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module apply_model_value__set_filter failed.
    A non-function (a model value) was applied as a function.
    line 17, col 16 to line 17, col 41 of module apply_model_value__set_filter
---*)
