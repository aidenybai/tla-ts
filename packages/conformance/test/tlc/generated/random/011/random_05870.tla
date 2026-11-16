(*---
description: Evaluates a random int expression, seed 262, number 5870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 = 2147483647) \/ (1 = 2)) * ([(1 :> 2) EXCEPT ![7] = 0])[(2 % 1)]) * ((-(3 % 1)) % ([[a |-> 1] EXCEPT !.a = @ + 3]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 53 to line 14, col 58 of module random_05870
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05870 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
