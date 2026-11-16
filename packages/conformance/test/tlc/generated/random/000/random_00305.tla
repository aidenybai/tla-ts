(*---
description: Evaluates a random set expression, seed 262, number 305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (0 = 3) -> LET b505 == 3 IN b505 [] OTHER -> (0 - 1) + (-(3 + -1))) .. Head(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3..1"
---*)
