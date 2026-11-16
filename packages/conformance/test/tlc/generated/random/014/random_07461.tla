(*---
description: Evaluates a random int expression, seed 262, number 7461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([[[<<3, 1, 2>> EXCEPT ![1] = 7] EXCEPT ![1] = ([x \in 1..2 |-> x])[2]] EXCEPT ![1] = Cardinality(UNION {SUBSET {1}, 2..1})]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
