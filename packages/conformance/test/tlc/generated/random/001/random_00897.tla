(*---
description: Evaluates a random seq expression, seed 262, number 897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Head(((2 - 7) :> [a |-> 3, b |-> FALSE])), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    (-5 :> [a |-> 3, b |-> FALSE])
    2283:0 The argument of Head should be a sequence, but instead it is:
    (-5 :> [a |-> 3, b |-> FALSE])
---*)
