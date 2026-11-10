(*---
description: Evaluates a random set expression, seed 262, number 4730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SortSeq(<<3, 7>>, LAMBDA p, q : p < q)), ([[{2, 1, 3} EXCEPT !.a = 3] EXCEPT !.a = @ + ((1 :> 2))[[a |-> 1, b |-> TRUE]]]).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04730 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
