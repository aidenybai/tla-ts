(*---
description: colon_greater of string_a, a StringValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> <<>>]"
---*)
