(*---
description: Evaluates a random seq expression, seed 262, number 562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(Tail(<<0, 0>>), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
