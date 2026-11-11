(*---
description: to_string applied to set_cap, a SetCapValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{2}"'
---*)
