(*---
description: to_string applied to tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<>>"'
---*)
