(*---
description: Evaluates a random function expression, seed 262, number 3202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5087 \in {Cardinality((2..1 \cap {x \in 1..3 : x > 1})) : b5088 \in {b5089 \in DOMAIN <<>> : (TRUE => FALSE)}} |-> (IF (\A b5090 \in {} : TRUE) THEN (FALSE <=> [x \in Nat |-> x + 1]) ELSE (-2) \div Cardinality({b5087, FALSE}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
