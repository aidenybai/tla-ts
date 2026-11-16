(*---
description: Evaluates a random int expression, seed 262, number 7544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = (-1 :> 0)] EXCEPT !.a = ((2 % 7) * (2147483647 % 0))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07544 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
