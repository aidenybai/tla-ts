(*---
description: Evaluates a random seq expression, seed 262, number 5324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(<<IF [a |-> 1] THEN 7 ELSE -1, (0 * 7)>>) EXCEPT ![1] = SubSeq([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (-1 \div 2)], ((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[IF TRUE THEN 1 ELSE 2], (LET b8235 == -1 IN 2 % Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05324 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 24 to line 14, col 50 of module random_05324
---*)
