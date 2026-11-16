(*---
description: Evaluates a random record expression, seed 262, number 3280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((7 + 0) * Cardinality({1, 2})) \div (Cardinality({x \in 1..3 : x > 1}) * IF FALSE THEN 3 ELSE 3)), b |-> (\A b5217 \in {b5218 \in {0 : b5219 \in {1, 2}} : ({1} \subseteq {})} : (\A b5220 \in (3 @@ [x \in Nat |-> x + 1]) : (~TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> TRUE]"
---*)
