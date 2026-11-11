(*---
description: Evaluates a random int expression, seed 262, number 2320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Len(Append(<<1, 2>>, TRUE))) - (Cardinality({2, 7}) % Head([<<3, 1, 2>> EXCEPT ![1] = 2147483647]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -5"
---*)
