(*---
description: colon_greater of int_negative, a IntValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> STRING)"
---*)
