(*---
description: colon_greater of string_empty, a StringValue, and set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_empty__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") :> ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("" :> {{}, {1}})'
---*)
