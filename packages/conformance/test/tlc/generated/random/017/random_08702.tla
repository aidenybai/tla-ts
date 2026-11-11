(*---
description: Evaluates a random bool expression, seed 262, number 8702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Len(<<3, 1, 2>>) : b13472 \in ({x \in 1..3 : x > 1} \cap 1..3)} \subseteq {(b13473 % b13473) : b13473 \in UNION {Nat, {2, 1, 3}}}) \/ (\E b13474 \in {(b13475 * b13475) : b13475 \in ({1} \ Nat)} : (\E b13476 \in {b13477 : b13477 \in 1..3} : (b13476 < 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08702 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
