(*---
description: Evaluates a random function expression, seed 262, number 8691.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08691 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF CASE TRUE -> 1 [] OTHER -> 7 THEN (-1 * 7) ELSE (2 % 3) % (LET b13457 == 3 IN b13457 - ((1 :> 2))[7])) :> (-((CHOOSE f \in [2..1 -> {1, 2}] : TRUE))[(3 * 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08691 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 18 to line 14, col 121 of module random_08691
---*)
