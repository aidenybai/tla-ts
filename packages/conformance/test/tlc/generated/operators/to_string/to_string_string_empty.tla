(*---
description: to_string applied to string_empty, a StringValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "\"\""'
---*)
