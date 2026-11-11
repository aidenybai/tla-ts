(*---
description: Evaluates a random seq expression, seed 262, number 1787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (TRUE => FALSE)]).a, (((-7) + Cardinality({1})) * ((0 \div 2) + Len(<<>>)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 0>>"
---*)
