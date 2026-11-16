(*---
description: Evaluates a random int expression, seed 262, number 8472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([SubSeq(<<3, 1, 2>>, 7, -1) EXCEPT ![1] = LET b13107 == 2 IN 2147483647] = [[b13108 \in SUBSET {1} |-> 1] EXCEPT ![([x \in 1..2 |-> x])[2147483647]] = ([a |-> 1, b |-> TRUE] % 1)]) THEN LET b13109 == LET b13110 == (-1 .. 2) IN (0 * 3) IN ((7 + 2) \div Head(<<>>)) ELSE ((-(CHOOSE b13111 \in {} : FALSE)) % ((FALSE => TRUE) - Cardinality({}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 46 of module random_08472
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08472 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
