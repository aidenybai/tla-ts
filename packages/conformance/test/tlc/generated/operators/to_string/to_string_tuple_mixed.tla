(*---
description: to_string applied to tuple_mixed, a TupleValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<1, \"a\", {TRUE}>>"'
---*)
