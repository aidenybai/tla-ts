(*---
description: append of tuple_empty, a TupleValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<FALSE>>"
---*)
