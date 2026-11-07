(*---
description: Evaluates a random int expression, seed 262, number 4360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE))[(IF (1 :> 2) THEN 2147483647 ELSE 7 * CASE TRUE -> 0 [] OTHER -> -1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04360 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 63 to line 14, col 128 of module random_04360
---*)
