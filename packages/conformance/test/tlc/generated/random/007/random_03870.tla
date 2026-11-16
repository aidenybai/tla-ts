(*---
description: Evaluates a random int expression, seed 262, number 3870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6093 == (-Len(SubSeq(<<1, 2>>, 1, [a |-> 1, b |-> TRUE]))) IN (((3 - b6093) + Len(<<>>)) + Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03870 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
