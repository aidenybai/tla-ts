(*---
description: Evaluates a random int expression, seed 262, number 4640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(Append(SelectSeq(<<>>, LAMBDA e : e > 0), CASE TRUE -> 2147483647 [] OTHER -> 2), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
