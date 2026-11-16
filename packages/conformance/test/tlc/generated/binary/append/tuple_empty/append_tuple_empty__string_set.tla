(*---
description: append of tuple_empty, a TupleValue, and string_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<STRING>>"
---*)
