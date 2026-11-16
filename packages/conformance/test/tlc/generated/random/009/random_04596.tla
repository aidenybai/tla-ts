(*---
description: Evaluates a random seq expression, seed 262, number 4596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)) EXCEPT ![1] = IF (1..3 = {2, 1, 3}) THEN (7 \div 1) ELSE LET b7204 == 2 IN [a |-> 1]] \o Tail([(<<3, 1, 2>> \o <<1, 2>>) EXCEPT ![1] = CASE [a |-> 1, b |-> TRUE] -> <<5, 6>> [] OTHER -> 3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 58 of module random_04596
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04596 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 200 to line 14, col 220 of module random_04596
---*)
