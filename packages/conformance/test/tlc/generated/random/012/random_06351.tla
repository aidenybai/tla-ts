(*---
description: Evaluates a random seq expression, seed 262, number 6351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b9757 == {([a |-> 1, b |-> TRUE]).a, (-1)} IN LET b9758 == (CHOOSE b9759 \in TRUE : FALSE) IN Len(<<1, 2>>), Cardinality(DOMAIN (3 :> 2147483647))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)
