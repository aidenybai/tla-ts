(*---
description: Evaluates a random bool expression, seed 262, number 631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 \cap {x \in 1..3 : x > 1}) \cap (1..3 \cap {x \in 1..3 : x > 1})) \cup (UNION {{1}, {x \in 1..3 : x > 1}} \ ({2, 1, 3} \ {2, 1, 3}))) = (CHOOSE r \in [a : {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00631 failed.
    Attempted to check if the value:
    2
    is an element of the integer -1
---*)
