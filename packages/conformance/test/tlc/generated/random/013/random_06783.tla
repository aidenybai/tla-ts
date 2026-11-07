(*---
description: Evaluates a random bool expression, seed 262, number 6783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10404 \in ({Cardinality(Nat), (2147483647 % -1)} \cap DOMAIN (2147483647 :> 2)) : ({b10405 \in DOMAIN [x \in Nat |-> x + 1] : (~FALSE)} \subseteq UNION {SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), {b10404, b10404}})))
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
