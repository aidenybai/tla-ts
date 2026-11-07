(*---
description: Evaluates a random bool expression, seed 262, number 715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a \in (({b1181 \in 1..3 : FALSE} + Cardinality(FALSE)) .. ((7 - 7) % IF FALSE THEN -1 ELSE 0))))
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
