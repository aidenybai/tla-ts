(*---
description: to_string applied to tuple, a TupleValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<1, 2>>"'
---*)
