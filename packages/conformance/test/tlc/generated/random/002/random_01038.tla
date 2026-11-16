(*---
description: Evaluates a random int expression, seed 262, number 1038.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1666 == Len(SortSeq(SelectSeq([x \in 1..2 |-> x], LAMBDA e : e > 0), LAMBDA p, q : p < q)) IN Len([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT ![1] = (-7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01038 failed.
    Attempted to access record by a non-string argument: 1
---*)
