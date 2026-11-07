(*---
description: Evaluates a random int expression, seed 262, number 2571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((CASE (TRUE \/ FALSE) -> Cardinality(SUBSET {1}) [] OTHER -> Cardinality({1}) .. CASE (0 \in SUBSET {1}) -> (<<5, 6>> + [a |-> 1, b |-> TRUE]) [] OTHER -> ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    2
    2181:0 Attempted to compute cardinality of the value
    2
---*)
