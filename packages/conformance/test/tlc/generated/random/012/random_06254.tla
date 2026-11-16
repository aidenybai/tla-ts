(*---
description: Evaluates a random int expression, seed 262, number 6254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) * Len(<<IF TRUE THEN -1 ELSE 0, Len(<<1, 2>>)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
