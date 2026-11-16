(*---
description: Evaluates a random bool expression, seed 262, number 1092.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((2147483647 .. 1) \cap (Nat \cap {1}))) = Len(Tail(Append(<<1>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
