(*---
description: Evaluates a random set expression, seed 262, number 219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (Cardinality((2..1 \cup {1})) :> Cardinality({-1, 2147483647})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
