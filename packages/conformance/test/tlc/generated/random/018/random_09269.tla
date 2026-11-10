(*---
description: Evaluates a random int expression, seed 262, number 9269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(-(Head(<<3, 1, 2>>) - (CHOOSE b14389 \in {x \in 1..3 : x > 1} : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
