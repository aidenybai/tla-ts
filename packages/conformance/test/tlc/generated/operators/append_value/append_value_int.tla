(*---
description: append_value applied to int, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, Int>>"
---*)
