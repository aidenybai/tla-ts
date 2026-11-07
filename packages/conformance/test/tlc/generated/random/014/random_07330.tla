(*---
description: Evaluates a random seq expression, seed 262, number 7330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(Append(SubSeq(<<3, 1, 2>>, {x \in 1..3 : x > 1}, 7), ([x \in 1..2 |-> x])[2147483647]), LAMBDA p, q : p < q) EXCEPT ![1] = (-(-Cardinality(3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {2, 3}
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {2, 3}
---*)
