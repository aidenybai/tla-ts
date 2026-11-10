(*---
description: Evaluates a random record expression, seed 262, number 7163.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07163 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), b |-> (<<2147483647, 3>> = [[a |-> 1] EXCEPT !.a = @ + 7])] EXCEPT !.a = Len(SelectSeq(SubSeq([a |-> 1], 0, FALSE), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07163 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)
