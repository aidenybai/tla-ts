(*---
description: Evaluates a random seq expression, seed 262, number 2364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<LET b3746 == ([a |-> 1]).a IN IF TRUE THEN 2 ELSE b3746, Len(Append(<<1>>, 2147483647))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
