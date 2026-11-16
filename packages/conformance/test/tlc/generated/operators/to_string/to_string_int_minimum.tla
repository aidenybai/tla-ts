(*---
description: to_string applied to int_minimum, a IntValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "-2147483648"'
---*)
