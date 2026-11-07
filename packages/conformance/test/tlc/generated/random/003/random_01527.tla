(*---
description: Evaluates a random seq expression, seed 262, number 1527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail([a |-> (3 \div 7), b |-> (FALSE <=> FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 0, b |-> TRUE]
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 0, b |-> TRUE]
---*)
