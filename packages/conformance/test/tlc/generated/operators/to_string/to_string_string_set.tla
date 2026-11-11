(*---
description: to_string applied to string_set, a UserValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "STRING"'
---*)
