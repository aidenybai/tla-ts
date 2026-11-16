(*---
description: Evaluates a random bool expression, seed 262, number 4702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7351 \in {(({1} = Nat) /\ (\E b7352 \in 1..3 : FALSE)), ([[x \in Nat |-> x + 1] EXCEPT ![1] = -1])[LET b7353 == 3 IN b7353]} : IF ((b7351 \in 2..1) /\ ([a |-> 1] = [a |-> 1])) THEN (Len(<<>>) + (2147483647 - 2147483647)) ELSE (-Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04702 failed.
    Attempted to check equality of the set {1} with the value:
    Nat
---*)
