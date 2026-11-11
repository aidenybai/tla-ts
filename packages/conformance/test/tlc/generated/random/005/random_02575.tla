(*---
description: Evaluates a random function expression, seed 262, number 2575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {(2..1 \ {1}), {TRUE, -1}}) :> Cardinality(((2..1 \cup {2, 1, 3}) \ {-1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02575 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    -1
---*)
