(*---
description: Evaluates a random int expression, seed 262, number 6885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((([x \in Nat |-> x + 1])[2] .. Head(<<>>))) \div (((-1 - 1) % ([a |-> 1, b |-> TRUE] * 3)) - Len(SubSeq(<<1>>, 3, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
