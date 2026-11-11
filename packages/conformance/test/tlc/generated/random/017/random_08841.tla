(*---
description: Evaluates a random bool expression, seed 262, number 8841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = (CHOOSE r \in [a : {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
