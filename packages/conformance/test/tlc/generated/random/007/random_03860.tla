(*---
description: Evaluates a random set expression, seed 262, number 3860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN [b6080 \in <<>> |-> 2]) .. (-([(1 :> 2) EXCEPT ![7] = 1])[(3 % 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<>>
    2181:0 Attempted to compute cardinality of the value
    <<>>
---*)
