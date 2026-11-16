(*---
description: Evaluates a random int expression, seed 262, number 4008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
