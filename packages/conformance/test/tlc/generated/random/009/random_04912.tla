(*---
description: Evaluates a random int expression, seed 262, number 4912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<((-0) % ([x \in 1..2 |-> x])[1]), Cardinality({0, 0})>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
