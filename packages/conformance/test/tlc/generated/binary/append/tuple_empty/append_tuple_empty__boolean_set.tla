(*---
description: append of tuple_empty, a TupleValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{FALSE, TRUE}>>"
---*)
