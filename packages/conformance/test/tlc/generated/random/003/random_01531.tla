(*---
description: Evaluates a random seq expression, seed 262, number 1531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<(Len(<<3, 1, 2>>) - (3 % 7)), Head([<<3, 1, 2>> EXCEPT ![1] = -1])>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1, 0>>"
---*)
