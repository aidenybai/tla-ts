(*---
description: Evaluates a random function expression, seed 262, number 2325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b3685 == ((2147483647 % -1) \div (2147483647 % 3)) IN Cardinality(DOMAIN [x \in Nat |-> x + 1]) :> LET b3686 == ((CHOOSE b3687 \in Nat : FALSE) - SortSeq(TRUE, LAMBDA p, q : p < q)) IN (~([a |-> 1, b |-> TRUE] \in {}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
