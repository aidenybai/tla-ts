(*---
description: Evaluates a random seq expression, seed 262, number 7173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SelectSeq((<<3, 1, 2>> \o <<>>), LAMBDA e : e > 0), Len((<<>> \o <<3, 1, 2>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1, 2, 3>>"
---*)
