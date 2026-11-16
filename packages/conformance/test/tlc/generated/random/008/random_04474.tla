(*---
description: Evaluates a random bool expression, seed 262, number 4474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq([<<1, 2>> EXCEPT ![1] = 2], LAMBDA p, q : p < q)) < Cardinality(DOMAIN (1 :> 7))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
