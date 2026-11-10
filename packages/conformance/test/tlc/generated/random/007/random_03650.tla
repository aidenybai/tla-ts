(*---
description: Evaluates a random set expression, seed 262, number 3650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b5774 \in (DOMAIN [x \in 1..2 |-> x] \ DOMAIN [x \in Nat |-> x + 1]) : (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) \/ ([a |-> 1] = [a |-> 1, b |-> TRUE]))} \cap {b5775 \in (Cardinality({2, 1, 3}) .. IF TRUE THEN 3 ELSE -1) : ((FALSE <=> FALSE) => (b5775 \in {1, 2}))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
