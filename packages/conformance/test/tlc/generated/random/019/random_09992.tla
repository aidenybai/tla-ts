(*---
description: Evaluates a random int expression, seed 262, number 9992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((-(3 + 3)) * SortSeq(Tail(<<>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
