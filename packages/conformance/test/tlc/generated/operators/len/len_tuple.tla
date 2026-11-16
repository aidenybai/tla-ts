(*---
description: len applied to tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
