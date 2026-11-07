(*---
description: Evaluates a random bool expression, seed 262, number 994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 2, b |-> FALSE]).a = (Cardinality(Nat) - IF TRUE THEN (1 :> 2) ELSE 2)) => ((~({1} = {x \in 1..3 : x > 1})) => ((2147483647 % 3) \in ({1, 2} \cup SUBSET {1})))))
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
