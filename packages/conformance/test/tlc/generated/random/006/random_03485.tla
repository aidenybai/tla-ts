(*---
description: Evaluates a random record expression, seed 262, number 3485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([[a |-> 1] EXCEPT !.a = @ + 0]).a, b |-> (SortSeq(<<>>, LAMBDA p, q : p < q) = (2147483647 :> -1))] EXCEPT !.a = @ + Head(([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2])[Len(<<1>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 149 to line 14, col 166 of module random_03485
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
---*)
