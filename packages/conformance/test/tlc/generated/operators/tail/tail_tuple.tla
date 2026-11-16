(*---
description: tail applied to tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
