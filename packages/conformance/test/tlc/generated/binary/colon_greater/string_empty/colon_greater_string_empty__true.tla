(*---
description: colon_greater of string_empty, a StringValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("" :> TRUE)'
---*)
