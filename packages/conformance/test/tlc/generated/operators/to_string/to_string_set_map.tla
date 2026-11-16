(*---
description: to_string applied to set_map, a SetEnumValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{2, 3}"'
---*)
