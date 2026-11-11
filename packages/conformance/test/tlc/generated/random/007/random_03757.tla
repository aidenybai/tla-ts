(*---
description: Evaluates a random seq expression, seed 262, number 3757.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03757 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(<<(-0), (0 \div 1)>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0>>"
---*)
