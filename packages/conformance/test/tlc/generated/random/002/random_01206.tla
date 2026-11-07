(*---
description: Evaluates a random seq expression, seed 262, number 1206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (3 * 2), CASE TRUE -> {x \in 1..3 : x > 1} [] OTHER -> 2147483647), LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    {2, 3}
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    {2, 3}
---*)
