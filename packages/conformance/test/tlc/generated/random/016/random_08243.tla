(*---
description: Evaluates a random seq expression, seed 262, number 8243.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08243 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq([<<1, 2147483647>> EXCEPT ![1] = LET b12754 == 7 IN 0], LAMBDA e : e > 0), LET b12755 == Head(Append(<<1, 2>>, 1)) IN ([a |-> b12755, b |-> FALSE]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647, 1>>"
---*)
