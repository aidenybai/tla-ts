(*---
description: head applied to tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
