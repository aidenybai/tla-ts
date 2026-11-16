(*---
description: Evaluates a random int expression, seed 262, number 3597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(Append([<<1>> EXCEPT ![1] = 2], Cardinality(1..3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
