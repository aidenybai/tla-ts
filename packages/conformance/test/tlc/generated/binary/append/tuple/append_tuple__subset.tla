(*---
description: append of tuple, a TupleValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, {{}, {1}, {2}, {1, 2}}>>"
---*)
