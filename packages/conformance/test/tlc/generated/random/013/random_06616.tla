(*---
description: Evaluates a random record expression, seed 262, number 6616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((7 * 1) \in UNION {1..3, {2, 1, 3}}) THEN (([a |-> 1, b |-> TRUE]).a \div (2147483647 - 2147483647)) ELSE LET b10153 == (-1 * 2147483647) IN Head(<<1, 2>>), b |-> [(CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(Cardinality({2, 1, 3}) % LET b10154 == 7 IN b10154)] = ((CHOOSE b10155 \in 1..3 : FALSE) * (3 % 1))]])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 192 to line 14, col 236 of module random_06616
    | [a |-> 1, b |-> <<2, 2>>]
---*)
