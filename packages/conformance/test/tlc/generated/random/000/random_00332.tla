(*---
description: Evaluates a random int expression, seed 262, number 332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (IF SortSeq(<<>>, LAMBDA p, q : p < q) THEN (2147483647 % 2147483647) ELSE ([a |-> 1, b |-> TRUE])[2147483647] < (CASE {1, 2} -> 2 [] OTHER -> 7 + (0 % 7))) -> (((2147483647 - 7) * (-2147483647)) - (IF FALSE THEN 7 ELSE 0 \div (2147483647 \div 2147483647))) [] OTHER -> (Cardinality({-1 : b560 \in {2, 1, 3}}) * SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 1], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00332 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 22 to line 14, col 175 of module random_00332
---*)
