(*---
description: to_string applied to true, a BoolValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "TRUE"'
---*)
