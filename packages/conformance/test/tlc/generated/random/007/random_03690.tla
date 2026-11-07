(*---
description: Evaluates a random function expression, seed 262, number 3690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[<<5, 6>> EXCEPT ![7] = 7] EXCEPT ![Cardinality({2, 1, 3})] = (7 - 1)] EXCEPT ![Head(Tail(<<>>))] = Len(SortSeq(<<>>, LAMBDA p, q : p < q))] EXCEPT ![(LET b5829 == ([x \in 1..2 |-> x])[0] IN (TRUE % b5829) + ((CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE))[LET b5830 == -1 IN 0])] = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a \div (Tail(<<1, 2>>) + Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_03690
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 44 of module random_03690
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
