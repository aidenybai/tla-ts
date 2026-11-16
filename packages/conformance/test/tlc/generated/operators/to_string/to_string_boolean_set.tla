(*---
description: to_string applied to boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{FALSE, TRUE}"'
---*)
