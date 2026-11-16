(*---
description: append of tuple_mixed, a TupleValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, Seq({1})>>'
---*)
