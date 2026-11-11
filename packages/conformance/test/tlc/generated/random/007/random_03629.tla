(*---
description: Evaluates a random function expression, seed 262, number 3629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] = (-1)[-1]) THEN Head([<<1>> EXCEPT ![1] = 2]) ELSE ([<<5, 6>> EXCEPT ![2] = 3])[(3 \div 3)] :> LET b5735 == ((7 + 2147483647) % (1 % 7)) IN Cardinality((b5735 .. b5735))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03629 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 62 to line 14, col 69 of module random_03629
---*)
