(*---
description: Evaluates a random seq expression, seed 262, number 5010.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05010 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([Cardinality((TRUE \cup {})) EXCEPT ![1] = LET b7793 == (CHOOSE b7794 \in {1, 2} : FALSE) IN ([a |-> 1]).a], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
