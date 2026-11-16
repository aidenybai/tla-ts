(*---
description: Evaluates a random set expression, seed 262, number 7050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [((-3) + Cardinality({})) EXCEPT ![((TRUE)[0] % (TRUE => TRUE))] = ((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))[(2147483647 * [x \in Nat |-> x + 1])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07050 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 59 to line 14, col 67 of module random_07050
---*)
