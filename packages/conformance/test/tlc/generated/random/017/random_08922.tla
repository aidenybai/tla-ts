(*---
description: Evaluates a random set expression, seed 262, number 8922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({b13832 \in {3, 3} : (\E b13833 \in {2, 1, 3} : TRUE)}), IF (SortSeq(<<>>, LAMBDA p, q : p < q) = (FALSE :> -1)) THEN LET b13834 == IF TRUE THEN <<>> ELSE 1 IN (2 + b13834) ELSE (IF TRUE THEN 2147483647 ELSE 2147483647 \div IF FALSE THEN 2147483647 ELSE <<3, 1, 2>>)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2147483647}"
---*)
