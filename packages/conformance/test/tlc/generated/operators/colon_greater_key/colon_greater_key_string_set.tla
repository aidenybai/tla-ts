(*---
description: colon_greater_key applied to string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(STRING :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> 1)"
---*)
