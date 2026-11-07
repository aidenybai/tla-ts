(*---
description: Evaluates a random function expression, seed 262, number 1277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2))[0] % (2 % -1)) + ([[a |-> 1] EXCEPT !.a = 2147483647]).a) :> [[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ((1 :> 2) % 2)] EXCEPT !.a = @ + (([x \in Nat |-> x + 1] * 3) + Head(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01277 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
