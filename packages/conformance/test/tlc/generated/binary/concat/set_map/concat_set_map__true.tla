(*---
description: concat of set_map, a SetEnumValue, and true, a BoolValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_map__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \o (TRUE))
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
