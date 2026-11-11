(*---
description: Evaluates a random int expression, seed 262, number 2884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((CHOOSE r \in [a : {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02884 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
