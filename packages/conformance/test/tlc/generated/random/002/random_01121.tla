(*---
description: Evaluates a random bool expression, seed 262, number 1121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = 7] EXCEPT !.a = @ + Cardinality({1})] EXCEPT !.a = @ + (LET b1797 == 0 IN -1 % (3 % 1))] = [(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ((2 :> 2))[(1 + 3)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01121 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
