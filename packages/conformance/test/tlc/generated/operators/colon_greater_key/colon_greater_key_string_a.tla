(*---
description: colon_greater_key applied to string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a" :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
