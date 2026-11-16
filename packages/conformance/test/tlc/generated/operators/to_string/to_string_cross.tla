(*---
description: to_string applied to cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{<<1, 3>>, <<2, 3>>}"'
---*)
