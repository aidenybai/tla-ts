(*---
description: Evaluates a random set expression, seed 262, number 105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b159 \in ((Cardinality(Nat) - (2 * 7)) .. (([x \in 1..2 |-> x])[7] \div Cardinality(1..3))) : ((([x \in Nat |-> x + 1])[2147483647] < IF FALSE THEN b159 ELSE b159) /\ (({} \subseteq {1, 2}) <=> (\E b160 \in {2, 1, 3} : FALSE)))})
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
