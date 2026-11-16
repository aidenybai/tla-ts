(*---
description: Evaluates a random seq expression, seed 262, number 6658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Append(SortSeq(<<>>, LAMBDA p, q : p < q), (7 + 3)), ([[x \in 1..2 |-> x] EXCEPT ![3] = 7])[Head(<<3, 1, 2>>)]), (IF ({1, 2} = {2, 1, 3}) THEN (1 \div 2) ELSE (-1 % 0) * ((-1 :> 2147483647))[LET b10215 == 2147483647 IN [a |-> 1]]), (IF (~TRUE) THEN Head(<<3, 1, 2>>) ELSE ([a |-> 1]).a :> (-(-3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 85 to line 14, col 102 of module random_06658
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06658 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
