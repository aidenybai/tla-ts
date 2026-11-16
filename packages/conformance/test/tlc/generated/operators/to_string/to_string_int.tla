(*---
description: to_string applied to int, a UserValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(Int))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "Int"'
---*)
