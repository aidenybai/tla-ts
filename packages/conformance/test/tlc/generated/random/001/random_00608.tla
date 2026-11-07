(*---
description: Evaluates a random bool expression, seed 262, number 608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b1017 == (CHOOSE b1018 \in [a |-> 1] : FALSE) IN (2147483647 \div 0) .. ((CHOOSE r \in [a : {1, 2}] : TRUE)).a) \subseteq {[a |-> (1 - 0), b |-> (\E b1019 \in Nat : FALSE)], Cardinality({7, 1})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
