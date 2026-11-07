(*---
description: Evaluates a random seq expression, seed 262, number 4659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(SubSeq([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3], {b7283 \in {2, 1, 3} : FALSE}, Len(<<3, 1, 2>>)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 3, b |-> TRUE]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 3, b |-> TRUE]
---*)
