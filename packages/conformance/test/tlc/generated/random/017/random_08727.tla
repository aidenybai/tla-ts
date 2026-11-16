(*---
description: Evaluates a random bool expression, seed 262, number 8727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0)) \in {b13514 \in {b13515 \in {3, 0} : (2147483647 < -1)} : (~(TRUE \/ FALSE))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
