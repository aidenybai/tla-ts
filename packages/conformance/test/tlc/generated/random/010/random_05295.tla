(*---
description: Evaluates a random seq expression, seed 262, number 5295.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05295 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0) \o SortSeq(SubSeq(<<>>, 2147483647, [a |-> 1]), LAMBDA p, q : p < q)) EXCEPT ![1] = LET b8199 == (-(-1 \div 3)) IN (Append(<<3, 1, 2>>, 3) = (CHOOSE r \in [a : {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
