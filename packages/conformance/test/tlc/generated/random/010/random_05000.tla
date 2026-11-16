(*---
description: Evaluates a random function expression, seed 262, number 5000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7776 \in {((-1 < 2))[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)] : b7777 \in {(3 - 1), (0 - 2147483647)}} |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = b7776] EXCEPT !.a = @ + LET b7778 == 3 IN 2]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05000 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 28 to line 14, col 82 of module random_05000
---*)
