(*---
description: Evaluates a random int expression, seed 262, number 633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Head(Tail(SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
