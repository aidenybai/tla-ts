(*---
description: to_string applied to set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{1, 2}"'
---*)
