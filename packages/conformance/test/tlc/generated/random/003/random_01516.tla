(*---
description: Evaluates a random int expression, seed 262, number 1516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SubSeq(Append(<<>>, 2), (1 + 2), (1 \div 1)), Len((<<3, 1, 2>> \o <<1>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<4>>"
---*)
