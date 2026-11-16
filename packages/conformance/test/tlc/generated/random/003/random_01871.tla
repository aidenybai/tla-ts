(*---
description: Evaluates a random seq expression, seed 262, number 1871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(IF (<<1>> = 1) THEN Cardinality({1}) ELSE ({x \in 1..3 : x > 1} * 1) % IF (\E b2946 \in 2..1 : FALSE) THEN (3 % 1) ELSE [(1 :> 2) EXCEPT ![[a |-> 1, b |-> TRUE]] = 3]), LET b2947 == ((-1 + 0) + IF FALSE THEN 3 ELSE 2147483647) IN ((0 + 1) % (-1 \div 3))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01871 failed.
    Attempted to check equality of the function <<1>> with the value:
    1
---*)
