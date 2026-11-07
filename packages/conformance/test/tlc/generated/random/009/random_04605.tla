(*---
description: Evaluates a random int expression, seed 262, number 4605.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04605 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b7212 == CASE (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = [b7213 \in SUBSET {1} |-> 7]) -> (([x \in 1..2 |-> x])[[a |-> 1, b |-> TRUE]] - (-0)) [] OTHER -> LET b7214 == ([a |-> 1]).a IN (b7214 - 1) IN ((Len(<<3, 1, 2>>) \div (2 \div b7212)) \div SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (b7212 * b7212), CASE TRUE -> 3 [] OTHER -> 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
