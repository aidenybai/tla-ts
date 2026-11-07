(*---
description: concat_right applied to union, a UnionValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o UNION {{1}, {2}})
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
