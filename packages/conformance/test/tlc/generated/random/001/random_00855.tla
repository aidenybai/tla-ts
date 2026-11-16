(*---
description: Evaluates a random int expression, seed 262, number 855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SubSeq((<<3, 1, 2>> \o <<1>>), Len(<<1, 2>>), IF FALSE THEN 3 ELSE 0) EXCEPT ![1] = ((CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))[Tail(<<3, 1, 2>>)]] \o (SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o SortSeq([3 EXCEPT ![1] = 0], LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 86 of module random_00855
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00855 failed.
    Attempted to apply EXCEPT construct to the value 3.
---*)
