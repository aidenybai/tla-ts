(*---
description: Evaluates a random bool expression, seed 262, number 650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({3, 2147483647} \subseteq ({} \ [a |-> 1])) \/ (([a |-> 1, b |-> TRUE] \subseteq 2..1) /\ (<<1, 2>> = [x \in Nat |-> x + 1]))) => (UNION {UNION {{x \in 1..3 : x > 1}, {1, 2}}, ([a |-> 1] .. 2147483647)} = {Head(<<1, 2>>) : b1087 \in {b1088 \in {1} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00650 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 68 to line 14, col 103 of module random_00650
---*)
