(*---
description: Evaluates a random int expression, seed 262, number 6007.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(b9253 * b9253) : b9253 \in ({2, 1, 3} \cup {x \in 1..3 : x > 1})}) + (([a |-> 1, b |-> TRUE]).a - ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
