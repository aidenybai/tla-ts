(*---
description: Evaluates a random function expression, seed 262, number 7805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([(1 :> 2) EXCEPT ![0] = 2])[(0 * 2147483647)] :> IF (0 => FALSE) THEN ([a |-> 1, b |-> TRUE]).a ELSE LET b12039 == 0 IN 1) EXCEPT ![((CHOOSE b12040 \in {b12041 \in 1..3 : FALSE} : (0 < 0)) * Cardinality({2, 2}))] = (CASE (~TRUE) -> Cardinality(2147483647) [] OTHER -> (2 * 2147483647) * [Tail(<<3, 1, 2>>) EXCEPT ![1] = Len(<<1>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 26 of module random_07805
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07805 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
