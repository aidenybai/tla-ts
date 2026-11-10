(*---
description: to_string applied to set_filter, a SetPredValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{2, 3}"'
---*)
