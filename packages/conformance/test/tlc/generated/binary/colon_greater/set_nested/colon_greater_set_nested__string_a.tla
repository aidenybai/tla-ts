(*---
description: colon_greater of set_nested, a SetEnumValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_nested__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({{}, {1}} :> "a")'
---*)
