(*---
description: append of tuple, a TupleValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, {FALSE, TRUE}>>"
---*)
