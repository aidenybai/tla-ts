(*---
description: Evaluates a random seq expression, seed 262, number 5745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(([[a |-> 1] EXCEPT !.a = @ + 1]).a * Head(<<0, 3>>)), Head(SortSeq(SortSeq(FALSE, LAMBDA p, q : p < q), LAMBDA p, q : p < q))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05745 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
---*)
