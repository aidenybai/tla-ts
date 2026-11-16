(*---
description: Evaluates a random seq expression, seed 262, number 3579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(([<<1, 2>> EXCEPT ![1] = 2147483647] \o Append(<<>>, 0)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
