(*---
description: append of tuple_empty, a TupleValue, and set_empty, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, {}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{}>>"
---*)
