(*---
description: Evaluates a random function expression, seed 262, number 3136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((0 - 1) \div (1 \div 3)) :> Len(<<3, 2147483647>>)) EXCEPT ![Cardinality({([a |-> 1] \div 2), ([x \in 1..2 |-> x])[1]})] = SubSeq(SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Len(FALSE), (2..1 % 2)), IF (\A b5016 \in 1..3 : TRUE) THEN LET b5017 == 2 IN b5017 ELSE Cardinality(SUBSET {1}), Len(SortSeq(<<>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
