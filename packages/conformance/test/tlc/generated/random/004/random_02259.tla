(*---
description: Evaluates a random set expression, seed 262, number 2259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) .. LET b3560 == (7 \div 0) IN (0 \div 7)), (Len(<<2, -1>>) .. LET b3561 == (0 \div 2) IN Cardinality({1, 2}))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
