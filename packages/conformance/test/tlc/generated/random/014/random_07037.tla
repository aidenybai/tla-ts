(*---
description: Evaluates a random seq expression, seed 262, number 7037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(<<Len(<<>>), IF TRUE THEN 3 ELSE 3>>, ((-1 - -1) - ([a |-> 1, b |-> TRUE]).a)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1, 0, 3>>"
---*)
