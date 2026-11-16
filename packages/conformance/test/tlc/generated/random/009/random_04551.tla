(*---
description: Evaluates a random record expression, seed 262, number 4551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[{2, 1, 3} EXCEPT !.a = @ + 7] EXCEPT !.a = (7 % 3)] EXCEPT !.a = @ + Len(<<3, 2147483647>>)] EXCEPT !.a = Head(SortSeq(SubSeq(<<3, 1, 2>>, 1, 0), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04551 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
