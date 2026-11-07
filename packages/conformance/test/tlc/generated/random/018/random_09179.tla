(*---
description: Evaluates a random int expression, seed 262, number 9179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((Tail(SelectSeq(<<>>, LAMBDA e : e > 0)) \o [SubSeq(<<>>, 0, 1) EXCEPT ![1] = (3 \div 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
