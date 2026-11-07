(*---
description: Evaluates a random seq expression, seed 262, number 3916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SortSeq(([a |-> 1]).a, LAMBDA p, q : p < q), LAMBDA e : e > 0), (((2 % [a |-> 1]) \div Head({})) % LET b6176 == (CHOOSE b6177 \in {1, 2} : TRUE) IN (b6176 \div b6176))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    1
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    1
---*)
