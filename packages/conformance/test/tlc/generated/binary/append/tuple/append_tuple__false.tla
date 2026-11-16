(*---
description: append of tuple, a TupleValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, FALSE>>"
---*)
