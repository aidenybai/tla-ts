(*---
description: Evaluates a random seq expression, seed 262, number 6820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SelectSeq(Append(<<3, 1, 2>>, 2), LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = Len(SortSeq((<<3, 1, 2>> \o <<>>), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 2, 2, 3>>"
---*)
