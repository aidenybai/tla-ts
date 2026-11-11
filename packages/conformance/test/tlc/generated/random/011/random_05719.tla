(*---
description: Evaluates a random bool expression, seed 262, number 5719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({2, 1, 3} \cap {x \in 1..3 : x > 1}) \ DOMAIN 0) = {LET b8799 == 1 IN [a |-> 1, b |-> TRUE], (-1)}) <=> ((\E b8800 \in (<<5, 6>> \ {}) : (~TRUE)) \/ ((-2) \in {2147483647, {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05719 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 59 to line 14, col 66 of module random_05719
---*)
