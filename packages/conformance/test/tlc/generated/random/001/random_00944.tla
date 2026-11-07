(*---
description: Evaluates a random bool expression, seed 262, number 944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([{1 : b1519 \in {2, 1, 3}} EXCEPT ![(2 \div 0)] = (7 \div 1)])[((3 - 0) * ((1 :> 2))[0])] = LET b1520 == Cardinality(DOMAIN 2) IN (([x \in Nat |-> x + 1])[b1520] - (-1 \div b1520))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
