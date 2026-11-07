(*---
description: Evaluates a random bool expression, seed 262, number 1846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SubSeq(Tail(<<1, 2>>), Cardinality(FALSE), Len(<<1, 2>>)), (IF FALSE THEN 3 ELSE 1 * Cardinality({2, 1, 3})), CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (3 - -1) [] OTHER -> (-2147483647)) = (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    FALSE
    2181:0 Attempted to compute cardinality of the value
    FALSE
---*)
