(*---
description: append of tuple_empty, a TupleValue, and union, a UnionValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{1, 2}>>"
---*)
