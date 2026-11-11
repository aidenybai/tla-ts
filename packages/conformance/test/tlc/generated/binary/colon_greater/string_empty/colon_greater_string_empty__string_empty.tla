(*---
description: colon_greater of string_empty, a StringValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("" :> "")'
---*)
