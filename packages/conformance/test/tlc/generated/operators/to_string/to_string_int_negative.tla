(*---
description: to_string applied to int_negative, a IntValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(-3))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "-3"'
---*)
