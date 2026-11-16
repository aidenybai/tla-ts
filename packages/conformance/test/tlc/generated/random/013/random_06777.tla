(*---
description: Evaluates a random set expression, seed 262, number 6777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10394 \in DOMAIN ((2 * 1) :> Cardinality({1, 2})) : (\A b10395 \in (Head([x \in 1..2 |-> x]) .. (b10394 \div b10394)) : ((1 \div b10395) < Cardinality({x \in 1..3 : x > 1})))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
