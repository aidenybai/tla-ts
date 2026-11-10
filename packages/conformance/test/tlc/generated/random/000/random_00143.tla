(*---
description: Evaluates a random int expression, seed 262, number 143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
