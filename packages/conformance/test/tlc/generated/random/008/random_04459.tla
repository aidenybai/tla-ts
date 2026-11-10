(*---
description: Evaluates a random int expression, seed 262, number 4459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (3 \div 2)), ((2 + 7) - CASE FALSE -> -1 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
