(*---
description: Evaluates a random int expression, seed 262, number 2116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([SortSeq((<<1, 2>> \o <<>>), LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality({1 : b3359 \in {1}})]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
