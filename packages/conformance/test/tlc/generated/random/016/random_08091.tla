(*---
description: Evaluates a random record expression, seed 262, number 8091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + ((3 + -1) \div (-3))] EXCEPT !.a = (LET b12500 == CASE TRUE -> 2 [] OTHER -> 2 IN (<<5, 6>>)[b12500] + ([[x \in 1..2 |-> x] EXCEPT ![7] = 2147483647])[(<<5, 6>>)[0]])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 184 to line 14, col 201 of module random_08091
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08091 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
