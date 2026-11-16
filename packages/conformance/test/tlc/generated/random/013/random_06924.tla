(*---
description: Evaluates a random int expression, seed 262, number 6924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (SortSeq([<<3, 1, 2>> EXCEPT ![1] = 3], LAMBDA p, q : p < q) = [[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT ![Head(<<3, 1, 2>>)] = (CHOOSE b10596 \in {1} : TRUE)]) -> (IF (0 = 1) THEN Len(<<1, 2>>) ELSE (-1 - 2147483647) * ((2147483647 + 7) + Cardinality(1..3))) [] OTHER -> (Len((TRUE <=> FALSE)) * LET b10597 == Len(<<1, 2>>) IN ([a |-> 1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06924 failed.
    Attempted to access record by a non-string argument: 3
---*)
