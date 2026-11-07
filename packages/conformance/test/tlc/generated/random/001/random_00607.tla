(*---
description: Evaluates a random function expression, seed 262, number 607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{} -> 1..2] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
