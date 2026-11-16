(*---
description: Evaluates a random function expression, seed 262, number 863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b1397 \in {b1398 \in {[a |-> 1, b |-> TRUE], 3} : (~FALSE)} : (([x \in Nat |-> x + 1] = [a |-> 1]) => (2147483647 < b1397))} :> Len(Tail(Tail(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00863 failed.
    Attempted to compare integer 3 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
