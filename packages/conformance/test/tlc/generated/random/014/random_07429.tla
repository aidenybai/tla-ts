(*---
description: Evaluates a random int expression, seed 262, number 7429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((SortSeq((<<>> \o <<3, 1, 2>>), LAMBDA p, q : p < q) \o Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LET b11450 == 2147483647 IN 2))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 6"
---*)
