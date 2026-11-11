(*---
description: Evaluates a random int expression, seed 262, number 4246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len({LET b6681 == Head(<<1>>) IN (-0) : b6680 \in ({b6682 \in {2, 1, 3} : FALSE} \cup ({x \in 1..3 : x > 1} \cup 1..3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04246 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    {0}
---*)
