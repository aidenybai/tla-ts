(*---
description: Evaluates a random function expression, seed 262, number 6952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Tail(<<3, 1, 2>>)) :> Len(Tail(<<1, 2>>))) :> Cardinality({(0 * 2), IF FALSE THEN 3 ELSE 2147483647})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ((2 :> 1) :> 2)"
---*)
