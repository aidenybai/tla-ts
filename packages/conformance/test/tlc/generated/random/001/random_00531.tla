(*---
description: Evaluates a random seq expression, seed 262, number 531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<([[a |-> 1] EXCEPT !.a = 0]).a, (~(0 = 3))>> EXCEPT ![1] = Len(SortSeq(<<3, 7>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, TRUE>>"
---*)
