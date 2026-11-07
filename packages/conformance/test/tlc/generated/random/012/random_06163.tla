(*---
description: Evaluates a random int expression, seed 262, number 6163.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06163 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> {1, 2}] : TRUE))[([[b9481 \in SUBSET {1} |-> 7] EXCEPT ![Cardinality(<<5, 6>>)] = ([a |-> 1, b |-> TRUE]).a]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<5, 6>>
    2181:0 Attempted to compute cardinality of the value
    <<5, 6>>
---*)
