(*---
description: Evaluates a random int expression, seed 262, number 930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((2..1 \cup TRUE)) + ([[x \in 1..2 |-> x] EXCEPT ![0] = 2147483647])[Cardinality({1})]) * (([[x \in 1..2 |-> x] EXCEPT ![1] = -1] @@ [[x \in 1..2 |-> x] EXCEPT ![7] = 2147483647]))[(Cardinality(1..3) % (2 % 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00930 failed.
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
