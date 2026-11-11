(*---
description: Evaluates a random function expression, seed 262, number 5875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(<<(CHOOSE b9058 \in {1} : TRUE), Head(<<3, 1, 2>>)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
