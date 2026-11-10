(*---
description: Evaluates a random bool expression, seed 262, number 3372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b5351 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2147483647] : (([x \in Nat |-> x + 1] <=> TRUE) <=> (\E b5352 \in b5351 : TRUE))} \subseteq ({Len(1), Cardinality({2, 1, 3})} \cup DOMAIN [[x \in 1..2 |-> x] EXCEPT ![1] = 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 36 to line 14, col 53 of module random_03372
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03372 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 94 to line 14, col 123 of module random_03372
---*)
