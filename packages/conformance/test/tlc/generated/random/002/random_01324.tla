(*---
description: Evaluates a random int expression, seed 262, number 1324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(<<IF FALSE THEN 0 ELSE 3, (3 * 7)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
