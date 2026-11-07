(*---
description: Evaluates a random record expression, seed 262, number 9458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(Cardinality(Nat) + (2147483647 * 3))), b |-> (<<Cardinality(2..1), (CHOOSE b14688 \in {} : FALSE)>> = [b14689 \in (SUBSET {1} \cup {1}) |-> ([x \in 1..2 |-> x])[b14689]])])
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
