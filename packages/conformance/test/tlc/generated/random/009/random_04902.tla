(*---
description: Evaluates a random seq expression, seed 262, number 4902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(Tail([a |-> [a |-> 1, b |-> TRUE], b |-> FALSE]), (-(-1 % 3))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> [a |-> 1, b |-> TRUE], b |-> FALSE]
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> [a |-> 1, b |-> TRUE], b |-> FALSE]
---*)
