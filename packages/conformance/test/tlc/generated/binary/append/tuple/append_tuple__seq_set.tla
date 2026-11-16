(*---
description: append of tuple, a TupleValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, Seq({1})>>"
---*)
