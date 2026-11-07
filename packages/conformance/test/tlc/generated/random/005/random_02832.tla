(*---
description: Evaluates a random set expression, seed 262, number 2832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len([<<>> EXCEPT ![1] = -1]) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]).a), Len(Append(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LET b4501 == 7 IN b4501))})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 23 to line 14, col 26 of module random_02832
    | {0, 4}
---*)
