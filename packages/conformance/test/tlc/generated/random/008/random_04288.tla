(*---
description: Evaluates a random int expression, seed 262, number 4288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({(0 % b6750) : b6750 \in {7 : b6751 \in {x \in 1..3 : x > 1}}} \ {b6752 \in {b6753 \in 2..1 : TRUE} : (\E b6754 \in 1..3 : FALSE)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
