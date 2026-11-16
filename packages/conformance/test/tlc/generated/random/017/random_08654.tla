(*---
description: Evaluates a random int expression, seed 262, number 8654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(LET b13388 == Cardinality({}) IN (b13388 + b13388) * ((CHOOSE r \in [a : 1..2] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
