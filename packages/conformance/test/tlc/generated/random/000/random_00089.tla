(*---
description: Evaluates a random seq expression, seed 262, number 89.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq([[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = @ + ([a |-> 1]).a], LAMBDA p, q : p < q), Head(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), ({1})[2], (-2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00089 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 2]
---*)
