(*---
description: Evaluates a random seq expression, seed 262, number 9765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(Tail(SubSeq(<<>>, 3, [a |-> 1, b |-> TRUE]))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
