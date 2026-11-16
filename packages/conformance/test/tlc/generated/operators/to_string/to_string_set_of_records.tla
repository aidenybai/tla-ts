(*---
description: to_string applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{[a |-> 1], [a |-> 2]}"'
---*)
