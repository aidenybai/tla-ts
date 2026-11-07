(*---
description: Evaluates a random int expression, seed 262, number 6831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
