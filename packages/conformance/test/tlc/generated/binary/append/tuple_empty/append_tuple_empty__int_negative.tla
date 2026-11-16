(*---
description: append of tuple_empty, a TupleValue, and int_negative, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, -3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-3>>"
---*)
