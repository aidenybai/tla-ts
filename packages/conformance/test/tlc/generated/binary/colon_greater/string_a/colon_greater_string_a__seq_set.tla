(*---
description: colon_greater of string_a, a StringValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> Seq({1})]"
---*)
