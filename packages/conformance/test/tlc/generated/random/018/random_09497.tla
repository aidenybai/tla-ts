(*---
description: Evaluates a random seq expression, seed 262, number 9497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b14755 == ((TRUE \/ FALSE) <=> (~FALSE)) IN Len(Append(<<1, 2>>, 3)), Cardinality({(b14756 + b14756) : b14756 \in ({1} \cap {2, 1, 3})})>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1>>"
---*)
