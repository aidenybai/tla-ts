(*---
description: Evaluates a random bool expression, seed 262, number 8225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE b12725 \in 1..3 : TRUE) \div Cardinality({1, 2}))) < ((Len(<<1>>) - Head(<<1>>)) - Head([<<1>> EXCEPT ![1] = 0]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
