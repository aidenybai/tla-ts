(*---
description: Evaluates a random seq expression, seed 262, number 3220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(<<Len(<<>>), Head(<<1>>)>>, ((-2147483647) :> ([a |-> 1]).a), (-(3 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    (-2147483647 :> 1)
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    (-2147483647 :> 1)
---*)
