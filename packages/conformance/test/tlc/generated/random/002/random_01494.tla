(*---
description: Evaluates a random record expression, seed 262, number 1494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
