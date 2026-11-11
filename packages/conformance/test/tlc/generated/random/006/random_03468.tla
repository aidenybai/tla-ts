(*---
description: Evaluates a random int expression, seed 262, number 3468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Len(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), ([x \in Nat |-> x + 1])[7]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
