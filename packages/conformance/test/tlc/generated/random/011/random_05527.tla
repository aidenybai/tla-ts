(*---
description: Evaluates a random int expression, seed 262, number 5527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Head([[<<>> EXCEPT ![1] = 2147483647] EXCEPT ![1] = ([x \in 1..2 |-> x])[0]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 28 of module random_05527
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 54 of module random_05527
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
