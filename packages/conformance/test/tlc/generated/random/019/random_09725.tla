(*---
description: Evaluates a random bool expression, seed 262, number 9725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(Nat)], LAMBDA p, q : p < q) = UNION {{(CHOOSE b15091 \in {2, 1, 3} : FALSE), ([a |-> 1]).a}, ({b15092 : b15092 \in Nat} \cap DOMAIN [x \in Nat |-> x + 1])}))
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
