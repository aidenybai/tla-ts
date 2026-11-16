(*---
description: Evaluates a random function expression, seed 262, number 5920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + ((CHOOSE f \in [2..1 -> 2..1] : TRUE))[(([a |-> 1]).a - LET b9128 == 0 IN 2147483647)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05920 failed.
    Attempted to apply function:
    <<>>
    to argument -2147483646, which is not in the domain of the function.
---*)
