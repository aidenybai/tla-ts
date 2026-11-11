(*---
description: Evaluates a random record expression, seed 262, number 8044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : 1..2] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
