(*---
description: Evaluates a random set expression, seed 262, number 7463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(((7 % b11503) .. (b11503 - 1))) : b11503 \in {((2 + 0) + (b11504 % 2147483647)) : b11504 \in UNION {{b11505 \in SUBSET {1} : TRUE}, {7, 1..3}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07463 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    7
---*)
