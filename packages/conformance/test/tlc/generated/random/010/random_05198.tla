(*---
description: Evaluates a random function expression, seed 262, number 5198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((DOMAIN [x \in Nat |-> x + 1] \ {3 : b8062 \in 2..1}) \cup ((2 * 1) .. LET b8063 == 7 IN 7)), DOMAIN ((\E b8064 \in 0 : FALSE) /\ (2 = 3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05198 failed.
    TLC encountered a non-enumerable quantifier bound
    0.
    0
---*)
