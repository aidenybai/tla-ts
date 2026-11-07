(*---
description: Evaluates a random seq expression, seed 262, number 4171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq([<<1, 2>> EXCEPT ![1] = 3], LAMBDA e : e > 0), Head([<<1, 2>> EXCEPT ![1] = 3])) \o [SubSeq(SortSeq([a |-> 1], LAMBDA p, q : p < q), Head(<<3, 1, 2>>), (2147483647 \div 3)) EXCEPT ![1] = (IF FALSE THEN 2 ELSE 3 \div Head(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
