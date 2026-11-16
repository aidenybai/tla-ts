(*---
description: colon_greater of string_a, a StringValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> {FALSE, TRUE}]"
---*)
