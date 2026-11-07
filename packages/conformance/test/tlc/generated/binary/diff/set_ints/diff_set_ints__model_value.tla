(*---
description: diff of set_ints, a SetEnumValue, and model_value, a ModelValue.
ref: tlc2/value/impl/SetDiffValue.java
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
---- MODULE diff_set_ints__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({2, 1}) \ (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module diff_set_ints__model_value failed.
    Attempted to check if the value:
    2
    is an element of the model value mv
---*)
