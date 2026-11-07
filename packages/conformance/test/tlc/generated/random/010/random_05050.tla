(*---
description: Evaluates a random bool expression, seed 262, number 5050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN 7 ELSE 2 .. (CHOOSE b7856 \in 1..3 : FALSE)) \cap (([a |-> 1]).a .. (-1 * 2))) = (Len(SortSeq(<<>>, LAMBDA p, q : p < q)) % Head(Append(<<>>, -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
