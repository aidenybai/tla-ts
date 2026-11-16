(*---
description: to_string applied to false, a BoolValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "FALSE"'
---*)
