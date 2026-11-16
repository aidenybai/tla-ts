(*---
description: Evaluates a random bool expression, seed 262, number 2706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (([x \in 1..2 |-> x])[0] % (2147483647 % 3))] = [a |-> (Head(<<3, 1, 2>>) - (CHOOSE r \in [a : {2, 1, 3}] : TRUE)), b |-> ((2 .. 0) = {1 : b4278 \in {x \in 1..3 : x > 1}})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02706 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
