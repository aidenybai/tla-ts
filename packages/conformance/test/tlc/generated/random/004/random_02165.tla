(*---
description: Evaluates a random bool expression, seed 262, number 2165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Tail((-1 * 2147483647)) EXCEPT ![1] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a] <=> (((2 % 2147483647) = (2 % -1)) \/ ({b3416 : b3416 \in Nat} = {b3417 : b3417 \in {1, 2}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    -2147483647
    2283:0 The argument of Tail should be a sequence, but instead it is:
    -2147483647
---*)
