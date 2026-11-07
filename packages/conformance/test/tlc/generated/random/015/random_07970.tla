(*---
description: Evaluates a random seq expression, seed 262, number 7970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(({1 : b12306 \in {2, 1, 3}} \cap DOMAIN [x \in 1..2 |-> x])), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1}
---*)
