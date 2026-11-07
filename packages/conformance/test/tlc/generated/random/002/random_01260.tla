(*---
description: Evaluates a random int expression, seed 262, number 1260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((-CASE FALSE -> 2147483647 [] OTHER -> 0) .. Cardinality({-1, 2147483647}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
