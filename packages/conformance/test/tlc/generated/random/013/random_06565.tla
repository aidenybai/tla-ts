(*---
description: Evaluates a random int expression, seed 262, number 6565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(FALSE) * (-2147483647)) \div IF ({} = {x \in 1..3 : x > 1}) THEN Cardinality({2, 1, 3}) ELSE Cardinality({x \in 1..3 : x > 1})) * LET b10087 == ((2147483647 % 2147483647) + Head(SUBSET {1})) IN LET b10088 == (2 \div b10087) IN (b10087 + <<1>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
