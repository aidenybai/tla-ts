(*---
description: Evaluates a random bool expression, seed 262, number 3198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((CHOOSE b5083 \in {1, 2} : TRUE) < Head(<<1>>)) \/ (([a |-> 1]).a = (-0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
