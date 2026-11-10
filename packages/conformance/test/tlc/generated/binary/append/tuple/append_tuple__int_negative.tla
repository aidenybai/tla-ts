(*---
description: append of tuple, a TupleValue, and int_negative, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, -3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, -3>>"
---*)
