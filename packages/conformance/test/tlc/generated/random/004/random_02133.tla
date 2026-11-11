(*---
description: Evaluates a random bool expression, seed 262, number 2133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(2147483647 * 2147483647) EXCEPT ![1] = (0 - 7)] = Cardinality([<<1, 2>> EXCEPT ![1] = 7])) /\ ((CHOOSE r \in [a : {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02133 failed.
    2178:0 Overflow when computing 2147483647*2147483647
---*)
