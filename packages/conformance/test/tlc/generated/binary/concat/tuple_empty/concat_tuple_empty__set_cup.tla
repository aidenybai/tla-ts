(*---
description: concat of tuple_empty, a TupleValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_tuple_empty__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) \o ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1, 2}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1, 2}
---*)
