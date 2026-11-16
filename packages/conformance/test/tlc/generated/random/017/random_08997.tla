(*---
description: Evaluates a random seq expression, seed 262, number 8997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0)), ((-(1 * 2)) % (Head(<<1, 2>>) * Len(<<3, 1, 2>>)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1>>"
---*)
