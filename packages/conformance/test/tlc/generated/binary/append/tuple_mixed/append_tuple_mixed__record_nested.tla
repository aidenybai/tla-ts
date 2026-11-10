(*---
description: append of tuple_mixed, a TupleValue, and record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, [a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, [a |-> [b |-> <<1>>]]>>'
---*)
