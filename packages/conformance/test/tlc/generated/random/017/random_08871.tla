(*---
description: Evaluates a random int expression, seed 262, number 8871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq(Append(Append(<<1>>, 7), ([a |-> 1]).a), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
