(*---
description: Evaluates a random bool expression, seed 262, number 1900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (IF FALSE THEN 0 ELSE 1 + Len(<<>>)), b |-> ([<<3, 1, 2>> EXCEPT ![1] = -1] = (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE))] = ((CASE FALSE -> 0 [] OTHER -> 0 % (-1 \div 2))).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01900 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
