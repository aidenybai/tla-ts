(*---
description: Evaluates a random function expression, seed 262, number 45.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Tail(<<1, 2>>)) \div ((-1 + 0) % (<<5, 6>>)[1])) :> Len(<<Head(<<1>>), ({x \in 1..3 : x > 1} \cap 2..1)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 2)"
---*)
