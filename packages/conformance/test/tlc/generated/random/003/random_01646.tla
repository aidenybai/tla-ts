(*---
description: Evaluates a random seq expression, seed 262, number 1646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Tail(SelectSeq(<<>>, LAMBDA e : e > 0)) EXCEPT ![1] = (([a |-> 1, b |-> TRUE]).a * (-1 - 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
