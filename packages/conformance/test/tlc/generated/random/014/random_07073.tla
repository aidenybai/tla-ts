(*---
description: Evaluates a random bool expression, seed 262, number 7073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 1..2] : TRUE) = [SortSeq([<<1>> EXCEPT ![1] = -1], LAMBDA p, q : p < q) EXCEPT !.a = ((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))[Head(<<1>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07073 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
