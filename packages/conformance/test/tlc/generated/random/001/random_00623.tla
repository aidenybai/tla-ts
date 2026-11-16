(*---
description: Evaluates a random seq expression, seed 262, number 623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(Append([<<1, 2>> EXCEPT ![1] = 3], LET b1044 == 2 IN -1)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1, 2>>"
---*)
