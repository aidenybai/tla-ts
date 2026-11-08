(*---
description: Evaluates a random int expression, seed 262, number 2799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b4437 \in (((0 + 1) - Len(<<1, 2>>)) .. Head([<<>> EXCEPT ![1] = 1])) : (\A b4438 \in UNION {DOMAIN [x \in Nat |-> x + 1], {b4439 : b4439 \in SUBSET {1}}} : ((0 + <<5, 6>>) < ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 70 to line 14, col 73 of module random_02799
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02799 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
