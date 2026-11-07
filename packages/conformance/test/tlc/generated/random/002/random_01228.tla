(*---
description: Evaluates a random int expression, seed 262, number 1228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Tail(SubSeq(<<1>>, 7, 0)) = (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
