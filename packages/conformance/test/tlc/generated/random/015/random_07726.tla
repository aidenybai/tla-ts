(*---
description: Evaluates a random function expression, seed 262, number 7726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<(CHOOSE r \in [a : {2, 1, 3}] : TRUE), Cardinality(SUBSET {1})>>) = (((-1 \div 0) % Len(<<1>>)) % Cardinality((2..1 \cap Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
