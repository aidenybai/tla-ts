(*---
description: Evaluates a random bool expression, seed 262, number 5645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((-2) % (2 + 7)), (Len(TRUE) * Len(<<>>))} = {b8723 \in [Tail(<<3, 1, 2>>) EXCEPT ![1] = (1 - 1)] : ([<<5, 6>> EXCEPT ![b8723] = b8723] = [[a |-> 1] EXCEPT !.a = @ + b8723])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05645 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
