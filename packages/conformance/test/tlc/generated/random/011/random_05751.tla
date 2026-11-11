(*---
description: Evaluates a random set expression, seed 262, number 5751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8852 \in {(IF TRUE THEN -1 ELSE 1 \div ([a |-> 1]).a), LET b8853 == (1 \div 2) IN (b8853 - 7)} : (Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) < (-LET b8854 == b8852 IN b8852))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-7}"
---*)
