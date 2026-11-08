(*---
description: Evaluates a random function expression, seed 262, number 9073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((UNION {2..1, {x \in 1..3 : x > 1}} \cup (2 .. 7))) :> (Tail(Tail(<<1>>)) = ([[x \in Nat |-> x + 1] EXCEPT ![[a |-> 1, b |-> TRUE]] = 7] @@ ([x \in 1..2 |-> x] @@ (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09073 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
