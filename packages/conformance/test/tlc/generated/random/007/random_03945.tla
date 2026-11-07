(*---
description: Evaluates a random seq expression, seed 262, number 3945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<Head(SubSeq(<<>>, 0, [a |-> 1])), ((-[a |-> 1, b |-> TRUE]) - (0 * 0))>>))
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
