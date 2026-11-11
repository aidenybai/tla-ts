(*---
description: Evaluates a random int expression, seed 262, number 9834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([LET b15269 == CASE TRUE -> -1 [] OTHER -> 2147483647 IN CASE TRUE -> b15269 [] OTHER -> 2 EXCEPT ![1] = (-Len(<<>>))], (((CHOOSE r \in [a : {}] : TRUE)).a + ((2 + 3) - (-3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09834 failed.
    Attempted to apply EXCEPT construct to the value -1.
---*)
