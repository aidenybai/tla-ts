(*---
description: Evaluates a random set expression, seed 262, number 2860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> (2147483647 + 7), b |-> (TRUE <=> FALSE)]).a, Cardinality((({x \in 1..3 : x > 1} \cup {2, 1, 3}) \cup (Nat \cap {2, 1, 3})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02860 failed.
    2178:0 Overflow when computing 2147483647+7
---*)
