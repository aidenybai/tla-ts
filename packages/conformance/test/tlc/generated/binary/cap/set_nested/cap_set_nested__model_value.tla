(*---
description: cap of set_nested, a SetEnumValue, and model_value, a ModelValue.
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
---- MODULE cap_set_nested__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({{1}, {}}) \cap (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module cap_set_nested__model_value failed.
    Attempted to check if the value:
    {1}
    is an element of the model value mv
---*)
