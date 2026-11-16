(*---
description: Evaluates a random seq expression, seed 262, number 5897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(Tail((SUBSET {1} \cup {1, 2})), LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05897 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1, 2} \cup {{}, {1}}
---*)
