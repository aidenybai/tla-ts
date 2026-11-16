(*---
description: colon_greater of string_a, a StringValue, and interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> {}]"
---*)
