(*---
description: Evaluates a random set expression, seed 262, number 2279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b3595 \in ({3 : b3596 \in {x \in 1..3 : x > 1}} \cap ({2, 1, 3} \cap {})) |-> Cardinality(DOMAIN [x \in 1..2 |-> x])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
