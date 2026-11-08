(*---
description: Evaluates a random seq expression, seed 262, number 7728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(Tail({1, -1}), ((3 + 1) % (FALSE /\ TRUE))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07728 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {-1, 1}
---*)
