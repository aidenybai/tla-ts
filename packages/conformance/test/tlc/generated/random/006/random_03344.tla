(*---
description: Evaluates a random int expression, seed 262, number 3344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((<<3, 1, 2>>)[2147483647] + ([a |-> 1, b |-> TRUE]).a), b |-> ((2 = 2147483647) /\ (1 \in {1}))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03344 failed.
    Attempted to access index 2147483647 of tuple
    <<3, 1, 2>>
    which is out of bounds.
---*)
