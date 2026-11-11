(*---
description: to_string applied to set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{{}, {1}}"'
---*)
