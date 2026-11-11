(*---
description: colon_greater of string_empty, a StringValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("" :> STRING)'
---*)
