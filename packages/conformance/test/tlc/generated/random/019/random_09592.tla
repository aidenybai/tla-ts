(*---
description: Evaluates a random seq expression, seed 262, number 9592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SelectSeq(SubSeq(<<>>, <<3, 1, 2>>, 3), LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = ((-IF TRUE THEN 0 ELSE 1) \div (-Cardinality({})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<3, 1, 2>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<3, 1, 2>>
---*)
