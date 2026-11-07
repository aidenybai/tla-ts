(*---
description: concat of tuple_mixed, a TupleValue, and set_map, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_tuple_mixed__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) \o ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {2, 3}
---*)
