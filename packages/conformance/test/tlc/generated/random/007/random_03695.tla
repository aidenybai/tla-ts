(*---
description: Evaluates a random bool expression, seed 262, number 3695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\A b5838 \in {b5839 \in SUBSET {1} : FALSE} : (~TRUE)) \/ ((2 % 7) < Cardinality(2..1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
