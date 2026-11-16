(*---
description: Evaluates a random set expression, seed 262, number 8726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head([(2..1).a EXCEPT ![1] = (0 % 1)]), Head((SortSeq(<<>>, LAMBDA p, q : p < q) \o SubSeq(<<1>>, 0, -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08726 failed.
    Attempted to select field "a" from a non-record value {}
    line 14, col 23 to line 14, col 30 of module random_08726
---*)
