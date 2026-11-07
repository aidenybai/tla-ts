(*---
description: Evaluates a random seq expression, seed 262, number 3139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SubSeq(Tail(<<1>>), (-1), (0 % -1)), Cardinality({7, [x \in Nat |-> x + 1]})) EXCEPT ![1] = Len(SortSeq(Append(<<>>, 3), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
