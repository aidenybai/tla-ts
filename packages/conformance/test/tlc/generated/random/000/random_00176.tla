(*---
description: Evaluates a random int expression, seed 262, number 176.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00176 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({Len((<<1, 2>> \o <<>>)), LET b283 == (7 + 2) IN Cardinality({})}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
