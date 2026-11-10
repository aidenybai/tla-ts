(*---
description: Evaluates a random int expression, seed 262, number 3989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Len(<<1, 2>>), b |-> (TRUE <=> FALSE)] EXCEPT !.a = Cardinality({3 : b6277 \in {1, 2}})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
