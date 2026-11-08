(*---
description: Evaluates a random set expression, seed 262, number 3392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5389 \in (((2 - 3) - Len(<<>>)) .. Len(Tail(<<1>>))) : ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = {b5389, 1}] = [a |-> (b5389 % 0), b |-> ({2, 1, 3} \subseteq {1})])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03392 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
