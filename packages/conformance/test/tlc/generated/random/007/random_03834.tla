(*---
description: Evaluates a random set expression, seed 262, number 3834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Tail(<<>>)) .. (([x \in Nat |-> x + 1] @@ <<1, 2>>))[(1 % 2147483647)]) .. (([a |-> 3, b |-> FALSE]).a - Cardinality((1..3 \ <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
