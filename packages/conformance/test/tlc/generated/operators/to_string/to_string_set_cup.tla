(*---
description: to_string applied to set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{1, 2}"'
---*)
