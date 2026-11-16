(*---
description: Evaluates a random int expression, seed 262, number 9545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((({2, 0} \cap {1, 3}) \cup ((7 \cup Nat) \ (-1 \in SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09545 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
