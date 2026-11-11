(*---
description: colon_greater of string_a, a StringValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> {{}, {1}, {2}, {1, 2}}]"
---*)
