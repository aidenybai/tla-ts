(*---
description: Evaluates a random function expression, seed 262, number 7951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1}] : TRUE) :> ([b12275 \in {-1 : b12276 \in {}} |-> ([a |-> 1]).a])[((1 + 0) + Head(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07951 failed.
    In applying the function
    <<>>,
    the first argument is:
    2
    which is not in its domain.
---*)
