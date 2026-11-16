(*---
description: Evaluates a random seq expression, seed 262, number 9351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SelectSeq((<<3, 1, 2>> \o <<1>>), LAMBDA e : e > 0)) EXCEPT ![1] = LET b14511 == Cardinality((2..1 \cup {})) IN (Len(<<1>>) + (-1))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 2, 1>>"
---*)
