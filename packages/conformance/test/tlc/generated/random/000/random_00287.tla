(*---
description: Evaluates a random int expression, seed 262, number 287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((DOMAIN [x \in 1..2 |-> x] \cap UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}}) \ ((2147483647 * 0) .. ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
