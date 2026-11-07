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
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
