(*---
description: Evaluates a random function expression, seed 262, number 7554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b11635 \in ((1 - 0) .. ([a |-> 1, b |-> TRUE]).a) : (({1, 2} \subseteq Nat) => (FALSE \/ TRUE))) :> ((CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE))[((7 - 2) \div (3 * 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07554 failed.
    2179:0 The second argument of \div is 0.
---*)
