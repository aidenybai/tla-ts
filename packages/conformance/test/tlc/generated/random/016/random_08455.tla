(*---
description: Evaluates a random int expression, seed 262, number 8455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Head(<<Cardinality(SUBSET {1}), (-0)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
