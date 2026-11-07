(*---
description: Evaluates a random int expression, seed 262, number 1926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({((3 + b3026) \div ([x \in 1..2 |-> x] + b3026)) : b3026 \in {b3027 \in {b3028 \in {1} : FALSE} : (\A b3029 \in {} : TRUE)}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
