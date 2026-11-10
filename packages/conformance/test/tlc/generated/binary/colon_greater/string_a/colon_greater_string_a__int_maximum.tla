(*---
description: colon_greater of string_a, a StringValue, and int_maximum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2147483647]"
---*)
