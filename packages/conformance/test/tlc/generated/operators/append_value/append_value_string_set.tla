(*---
description: append_value applied to string_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, STRING>>"
---*)
