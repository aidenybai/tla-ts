(*---
description: append of tuple_empty, a TupleValue, and true, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<TRUE>>"
---*)
