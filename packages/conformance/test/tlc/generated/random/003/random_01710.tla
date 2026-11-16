(*---
description: Evaluates a random bool expression, seed 262, number 1710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2] EXCEPT ![(<<5, 6>>)[2147483647]] = (2147483647 % 2147483647)] EXCEPT ![Head([<<1, 2>> EXCEPT ![1] = 2])] = (([x \in 1..2 |-> x])[3] % (-1 - 2))] = ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_01710
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01710 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
