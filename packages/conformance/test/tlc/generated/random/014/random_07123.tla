(*---
description: Evaluates a random record expression, seed 262, number 7123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF Head(<<1, 2>>) THEN LET b10936 == 1 IN b10936 ELSE LET b10937 == 7 IN [a |-> 1], b |-> (({2, 1, 3} <=> FALSE) => ([a |-> 1, b |-> TRUE] = [a |-> 1]))] EXCEPT !.a = Len(SortSeq(Append(<<1, 2>>, 7), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07123 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 24 to line 14, col 105 of module random_07123
---*)
