(*---
description: Evaluates a random bool expression, seed 262, number 5844.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05844 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((SelectSeq(<<1>>, LAMBDA e : e > 0) = (CHOOSE f \in [{} -> {}] : TRUE)) \/ (([a |-> 1]).a = (2 + -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
