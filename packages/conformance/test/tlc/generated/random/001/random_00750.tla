(*---
description: Evaluates a random function expression, seed 262, number 750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({x \in 1..3 : x > 1}) % ([a |-> 1, b |-> TRUE]).a) .. CASE (\E b1233 \in 1..3 : FALSE) -> CASE TRUE -> {1, 2} [] OTHER -> 1 [] OTHER -> Head(<<>>)) :> Len(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
