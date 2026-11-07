(*---
description: concat of set_map, a SetEnumValue, and model_value, a ModelValue.
ref: tlc2/module/Sequences.java#Concat
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
---- MODULE concat_set_map__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({x + 1 : x \in 1..2}) \o (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {2, 3}
---*)
