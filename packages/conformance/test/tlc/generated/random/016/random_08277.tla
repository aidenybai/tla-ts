(*---
description: Evaluates a random seq expression, seed 262, number 8277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = ((<<5, 6>>)[2] % (2 % 3))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
