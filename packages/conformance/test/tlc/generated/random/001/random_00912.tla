(*---
description: Evaluates a random bool expression, seed 262, number 912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\E b1470 \in DOMAIN <<5, 6>> : (<<3, 1, 2>> = [x \in Nat |-> x + 1]))) /\ (\E b1471 \in {IF TRUE THEN 2147483647 ELSE 2147483647, IF FALSE THEN 7 ELSE 2147483647} : ((TRUE /\ FALSE) /\ (~FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00912 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
