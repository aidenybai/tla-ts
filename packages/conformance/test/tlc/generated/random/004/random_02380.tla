(*---
description: Evaluates a random int expression, seed 262, number 2380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = Head({})] EXCEPT !.a = @ + ((0 % 0) + (1 - 7))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02380 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
