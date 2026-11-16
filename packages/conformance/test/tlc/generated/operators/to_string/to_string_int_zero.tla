(*---
description: to_string applied to int_zero, a IntValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(0))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "0"'
---*)
