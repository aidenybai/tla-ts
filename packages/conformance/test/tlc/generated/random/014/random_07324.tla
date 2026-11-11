(*---
description: Evaluates a random bool expression, seed 262, number 7324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((CHOOSE b11270 \in {2, 1, 3} : TRUE) + Head(<<1>>)) \in ({1 : b11271 \in {}} \ {b11272 : b11272 \in 2..1}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
