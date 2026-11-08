(*---
description: Evaluates a random int expression, seed 262, number 69.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((~(([a |-> 1] = [a |-> 1]) => (\E b100 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00069 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
