(*---
description: Evaluates a random set expression, seed 262, number 4660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((1 - 2147483647) :> (-0)) @@ (CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-2147483646, 1, 2, 3}"
---*)
