(*---
description: Evaluates a random set expression, seed 262, number 9614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CASE TRUE -> 1 [] OTHER -> 7 % (CHOOSE b14927 \in 2..1 : TRUE)) + (Head([a |-> 1, b |-> TRUE]) + [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0])), (((2147483647 % 0) * [b14928 \in 2147483647 |-> 2]) * (({x \in 1..3 : x > 1} \cap {1}) + LET b14929 == 2 IN 2))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09614 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
