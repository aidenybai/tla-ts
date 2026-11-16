(*---
description: Evaluates a random seq expression, seed 262, number 3583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{} -> 1..2] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
