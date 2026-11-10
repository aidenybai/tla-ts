(*---
description: Evaluates a random int expression, seed 262, number 8188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Cardinality(UNION {{2, 1, 3}, {1, 2}}), b |-> ((1 - 1) \in (TRUE \/ TRUE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08188 failed.
    Attempted to check if the value:
    0
    is an element of the boolean TRUE
---*)
